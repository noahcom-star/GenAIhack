-- Query to check logs from Vapi webhook
SELECT * FROM logs WHERE message ILIKE '%VAPI WEBHOOK%' ORDER BY created_at DESC LIMIT 50;
