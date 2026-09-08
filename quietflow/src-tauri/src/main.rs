#![cfg_attr(
    all(debug_assertions, target_os = "windows"),
)]

mod nfc;

use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn platform_info() -> serde_json::Value {
    serde_json::json!({
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "version": std::env::consts::FAMILY,
    })
}

#[tauri::command]
fn nfc_list_readers() -> Result<Vec<String>, String> {
    nfc::list_readers().map_err(|e| e.to_string())
}

#[tauri::command]
fn nfc_read_card(reader_name: &str) -> Result<serde_json::Value, String> {
    nfc::read_card(reader_name)
        .map(|info| serde_json::to_value(&info).unwrap())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn nfc_get_card_uid(reader_name: &str) -> Result<serde_json::Value, String> {
    nfc::get_card_uid(reader_name)
        .map(|info| serde_json::to_value(&info).unwrap())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn nfc_write_card(reader_name: &str, uid: &str, name: &str, access_code: &str, card_type: &str, writer: &str) -> Result<serde_json::Value, String> {
    let data = nfc::KeyFobData {
        uid: uid.to_string(),
        name: name.to_string(),
        access_code: access_code.to_string(),
        card_type: card_type.to_string(),
        writer: writer.to_string(),
    };
    nfc::write_card(reader_name, &data)
        .map(|result| serde_json::to_value(&result).unwrap())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn nfc_read_card_first_available() -> Result<serde_json::Value, String> {
    nfc::read_card_first_available()
        .map(|info| serde_json::to_value(&info).unwrap())
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            platform_info,
            nfc_list_readers,
            nfc_read_card,
            nfc_get_card_uid,
            nfc_write_card,
            nfc_read_card_first_available,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}