# VeriTruth TODO

## Backend
- [x] Veritabanı şeması: verifications, agent_results tabloları
- [x] DB migration oluştur ve uygula
- [x] server/db.ts: verification ve agent_results sorgu yardımcıları
- [x] server/agents.ts: OpenAI + Gemini ile 3 uzman ajan (Kaynak, Mantık, Çapraz)
- [x] server/consensus.ts: Proof of Reliability skoru ve konsensüs kararı
- [x] tRPC router: verify.submit, verify.getById, verify.history

## Frontend
- [x] index.css: Zarif, koyu tonlu profesyonel tema (renk paleti, fontlar)
- [x] App.tsx: Route yapısı (/, /verify/:id, /history)
- [x] Home.tsx: İddia giriş formu + hero section
- [x] VerificationLive.tsx: Canlı ajan analiz akışı (adım adım progress)
- [x] VerificationResult.tsx: Detaylı sonuç raporu (ajan bulguları, skor, karar)
- [x] History.tsx: Geçmiş doğrulamalar listesi

## Dokümantasyon & GitHub
- [x] README.md (Cosmos Grants uyumlu)
- [x] .env.example
- [x] GitHub reposu oluştur ve push et

## Test
- [x] Vitest: consensus mekanizması testleri (6 test)
- [x] Vitest: auth.logout testleri (1 test)
