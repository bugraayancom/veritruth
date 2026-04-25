# VeriTruth TODO

## Backend
- [ ] Veritabanı şeması: verifications, agent_results tabloları
- [ ] DB migration oluştur ve uygula
- [ ] server/db.ts: verification ve agent_results sorgu yardımcıları
- [ ] server/agents.ts: OpenAI + Gemini ile 3 uzman ajan (Kaynak, Mantık, Çapraz)
- [ ] server/consensus.ts: Proof of Reliability skoru ve konsensüs kararı
- [ ] tRPC router: verify.submit, verify.getById, verify.history

## Frontend
- [ ] index.css: Zarif, koyu tonlu profesyonel tema (renk paleti, fontlar)
- [ ] App.tsx: Route yapısı (/, /verify/:id, /history)
- [ ] Home.tsx: İddia giriş formu + hero section
- [ ] VerificationLive.tsx: Canlı ajan analiz akışı (adım adım progress)
- [ ] VerificationResult.tsx: Detaylı sonuç raporu (ajan bulguları, skor, karar)
- [ ] History.tsx: Geçmiş doğrulamalar listesi

## Dokümantasyon & GitHub
- [ ] README.md (Cosmos Grants uyumlu)
- [ ] .env.example
- [ ] GitHub reposu oluştur ve push et

## Test
- [ ] Vitest: verify router unit testleri
- [ ] Vitest: consensus mekanizması testleri
