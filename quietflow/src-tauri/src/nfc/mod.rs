use pcsc::{Attribute, Context, Protocols, ShareMode};
use serde::{Deserialize, Serialize};
use std::ffi::CString;
use std::fmt;

/// NFC card info returned from a reader.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NfcCardInfo {
    pub uid: String,
    pub atr: String,
    pub reader_name: String,
    pub protocol: String,
}

/// Key fob data to write to a card.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KeyFobData {
    pub uid: String,
    pub name: String,
    pub access_code: String,
    pub card_type: String,
    pub writer: String,
}

/// Result of a write operation.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NfcWriteResult {
    pub success: bool,
    pub message: String,
    pub written_uid: Option<String>,
}

#[derive(Debug)]
pub enum NfcError {
    ReaderError(String),
    ConnectionError(String),
    ReadError(String),
    WriteError(String),
    NoCardPresent,
    Unknown(String),
}

impl fmt::Display for NfcError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            NfcError::ReaderError(msg) => write!(f, "No reader found: {msg}"),
            NfcError::ConnectionError(msg) => write!(f, "Card connection error: {msg}"),
            NfcError::ReadError(msg) => write!(f, "Card read error: {msg}"),
            NfcError::WriteError(msg) => write!(f, "Card write error: {msg}"),
            NfcError::NoCardPresent => write!(f, "No card present"),
            NfcError::Unknown(msg) => write!(f, "Unknown error: {msg}"),
        }
    }
}

impl std::error::Error for NfcError {}

/// List all available PC/SC readers.
pub fn list_readers() -> Result<Vec<String>, NfcError> {
    let ctx = Context::establish(pcsc::Scope::System)
        .map_err(|e| NfcError::ReaderError(e.to_string()))?;
    let readers = ctx
        .list_readers_owned()
        .map_err(|e| NfcError::ReaderError(e.to_string()))?;
    Ok(readers
        .iter()
        .map(|r| r.to_string_lossy().to_string())
        .collect())
}

/// Read card UID from a specific reader.
pub fn read_card(reader_name: &str) -> Result<NfcCardInfo, NfcError> {
    get_card_uid(reader_name)
}

/// Get UID from a specific reader.
pub fn get_card_uid(reader_name: &str) -> Result<NfcCardInfo, NfcError> {
    let ctx = Context::establish(pcsc::Scope::System)
        .map_err(|e| NfcError::ConnectionError(e.to_string()))?;

    let reader_cstr = CString::new(reader_name).map_err(|_| {
        NfcError::ReaderError("Invalid reader name".to_string())
    })?;

    let card = ctx
        .connect(&reader_cstr, ShareMode::Shared, Protocols::T0 | Protocols::T1)
        .map_err(|e| NfcError::ConnectionError(e.to_string()))?;

    // Get ATR using get_attribute_owned
    let atr = card
        .get_attribute_owned(Attribute::AtrString)
        .map_err(|e| NfcError::ReadError(e.to_string()))?;
    let atr_hex = hex::encode(&atr);

    // Get protocol using get_attribute_owned
    let protocol = card
        .get_attribute_owned(Attribute::CurrentProtocolType)
        .map(|bytes| {
            if bytes.len() == 4 {
                let val = u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]);
                get_protocol_from_raw(val)
            } else {
                format!("Protocol 0x{:X}", u32::from_le_bytes([
                    bytes.get(0).copied().unwrap_or(0),
                    bytes.get(1).copied().unwrap_or(0),
                    bytes.get(2).copied().unwrap_or(0),
                    bytes.get(3).copied().unwrap_or(0),
                ]))
            }
        })
        .unwrap_or_else(|_| "Unknown".to_string());

    // Try to get UID via GET CHARS APDU
    let uid = read_uid_via_apdu(&card);

    Ok(NfcCardInfo {
        uid,
        atr: atr_hex,
        reader_name: reader_name.to_string(),
        protocol,
    })
}

/// Write key fob data to a card via a specific reader.
pub fn write_card(reader_name: &str, data: &KeyFobData) -> Result<NfcWriteResult, NfcError> {
    let ctx = Context::establish(pcsc::Scope::System)
        .map_err(|e| NfcError::ConnectionError(e.to_string()))?;

    let reader_cstr = CString::new(reader_name).map_err(|_| {
        NfcError::ReaderError("Invalid reader name".to_string())
    })?;

    let card = ctx
        .connect(&reader_cstr, ShareMode::Shared, Protocols::T0 | Protocols::T1)
        .map_err(|e| NfcError::ConnectionError(e.to_string()))?;

    // Write payload: KF|<uid>|<name>|<access_code>|<card_type>|<writer>
    let payload = format!(
        "KF|{}|{}|{}|{}|{}",
        data.uid, data.name, data.access_code, data.card_type, data.writer
    );
    let payload_bytes = payload.as_bytes();

    // APDU command: FF D6 00 00 <len> <payload>
    let mut cmd: Vec<u8> = vec![0xFF, 0xD6, 0x00, 0x00, payload_bytes.len() as u8];
    cmd.extend_from_slice(payload_bytes);

    // Need to allocate receive buffer
    let mut recv_buf: Vec<u8> = vec![0u8; 262];
    let response = card
        .transmit(&cmd, &mut recv_buf)
        .map_err(|e| NfcError::WriteError(e.to_string()))?;

    let success = response.len() >= 2
        && response[response.len() - 2] == 0x90
        && response[response.len() - 1] == 0x00;

    Ok(NfcWriteResult {
        success,
        message: if success {
            "Card written successfully".to_string()
        } else {
            format!(
                "Write returned status: {:02X}{:02X}",
                response.last().unwrap_or(&0xFF),
                response.get(response.len().saturating_sub(2)).unwrap_or(&0xFF)
            )
        },
        written_uid: Some(data.uid.clone()),
    })
}

/// Attempt to read a card from the first available reader.
pub fn read_card_first_available() -> Result<NfcCardInfo, NfcError> {
    let readers = list_readers()?;
    if readers.is_empty() {
        return Err(NfcError::ReaderError("No NFC readers found".to_string()));
    }
    for reader_name in &readers {
        match get_card_uid(reader_name) {
            Ok(info) => return Ok(info),
            Err(_) => continue,
        }
    }
    Err(NfcError::NoCardPresent)
}

/// Read UID via GET CHARS APDU command (FF CA 00 00 00).
fn read_uid_via_apdu(card: &pcsc::Card) -> String {
    let uid_cmd: &[u8] = &[0xFF, 0xCA, 0x00, 0x00, 0x00];
    let mut recv_buf: Vec<u8> = vec![0u8; 262];

    if let Ok(response) = card.transmit(uid_cmd, &mut recv_buf) {
        if response.len() >= 2 {
            let data_len = response.len() - 2;
            let sw1 = response[data_len];
            let sw2 = response[data_len + 1];
            if sw1 == 0x90 && sw2 == 0x00 {
                return hex::encode(&response[..data_len]).to_uppercase();
            }
        }
    }

    // Fallback: derive from ATR
    let atr = card
        .get_attribute_owned(Attribute::AtrString)
        .unwrap_or_default();
    format!("ATR-{}", hex::encode(atr).to_uppercase())
}

/// Get protocol name from raw protocol value.
fn get_protocol_from_raw(val: u32) -> String {
    match val {
        0x00000001 => "T0 (ISO 14443-3 A)".to_string(),
        0x00000002 => "T1 (ISO 14443-3 B)".to_string(),
        0x00010000 => "RAW".to_string(),
        _ => format!("Protocol 0x{:X}", val),
    }
}

/// Identify card type from ATR bytes.
pub fn card_type_from_atr(atr_hex: &str) -> &'static str {
    let atr = atr_hex.to_lowercase();
    if atr.starts_with("3b8f") || atr.starts_with("3b8e") {
        "ISO 14443-4 (DESFire / NFC-DEP)"
    } else if atr.starts_with("3b8c") {
        "ISO 14443-3 (NFC-A)"
    } else if atr.starts_with("3b6c") {
        "ISO 14443-4 (NFC-B)"
    } else if atr.starts_with("3b00") {
        "ISO 14443-3 (NFC-A)"
    } else if atr.starts_with("3b79") {
        "ISO 14443-4 (NFC-B)"
    } else if atr.starts_with("3b81") {
        "ISO 14443-3 (NFC-A, Felica)"
    } else {
        "Unknown (ATR-based identification)"
    }
}