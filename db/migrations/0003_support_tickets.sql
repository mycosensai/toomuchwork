-- Support tickets table: every inquiry (website / telegram / email) becomes an individual ticket.
CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_no TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'normal',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  telegram_user_id TEXT,
  telegram_username TEXT,
  telegram_chat_id TEXT,
  assigned_agent TEXT,
  acknowledged INTEGER NOT NULL DEFAULT 0,
  acknowledged_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at);
