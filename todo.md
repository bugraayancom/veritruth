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

## Cosmos Blockchain Entegrasyonu
- [x] CosmJS bağımlılıklarını ekle (@cosmjs/stargate, @cosmjs/proto-signing, @cosmjs/encoding)
- [x] server/cosmos.ts: Cosmos testnet bağlantısı ve on-chain kayıt servisi
- [x] drizzle/schema.ts: verifications tablosuna txHash ve cosmosAddress alanları ekle
- [x] DB migration uygula
- [x] tRPC router: cosmos.buildAnchorParams, cosmos.recordAnchor, cosmos.getChainStatus, cosmos.verifyAnchor
- [x] Frontend: CosmosWallet.tsx - Keplr cüzdan bağlantı bileşeni
- [x] Frontend: Result sayfasına "Anchor to Cosmos" butonu ve on-chain kayıt UI
- [x] Frontend: Zincir durumu göstergesi (bağlı ağ, blok yüksekliği)
- [x] README.md güncelle - Cosmos entegrasyonu bölümü ekle

## CosmWasm Akıllı Sözleşmesi
- [ ] Rust + CosmWasm geliştirme ortamını kur (rustup, wasm32 target, cargo-generate)
- [ ] contracts/veritruth-registry/ dizininde kontrat scaffold oluştur
- [ ] Kontrat: AnchorVerification mesajı (store proof on-chain)
- [ ] Kontrat: QueryVerification sorgusu (id ile proof getir)
- [ ] Kontrat: QueryAllVerifications sorgusu (tüm kayıtlar)
- [ ] Kontrat: unit testleri yaz
- [ ] Kontratı wasm olarak derle ve optimize et
- [ ] Cosmos testnet'e deploy et (wasmd CLI veya CosmJS)
- [ ] server/cosmos.ts: kontrat execute/query fonksiyonları ekle
- [ ] tRPC router: cosmos.anchorToContract ve cosmos.queryContract prosedürleri
- [ ] Frontend: sonuç sayfasında kontrat adresini ve on-chain kayıt linkini göster
- [ ] README.md: CosmWasm kontrat bölümü ekle
- [ ] GitHub'a push et
