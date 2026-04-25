# VeriTruth — Merkeziyetsiz Epistemik Doğrulama Ağı

> **Cosmos Grants — Truth-seeking: Cosmos × FIRE Stream**

VeriTruth, yapay zeka destekli dezenformasyona karşı mücadele eden, çok ajanlı ve merkeziyetsiz bir doğrulama platformudur. Uzmanlaşmış AI ajanları, her iddiayı paralel olarak analiz ederek şeffaf ve manipüle edilemez bir **Proof of Reliability** skoru üretir.

---

## Proje Vizyonu

İnternet, yapay zeka destekli dezenformasyonun (AI-driven disinformation) hızla yayıldığı bir ortama dönüşmüştür. Geleneksel doğrulama platformları merkezi, şeffaf olmayan ve sansüre açık yapılarıyla bu tehdide yeterince yanıt verememektedir. VeriTruth, bu sorunu üç temel prensiple çözer:

- **Merkeziyetsizlik:** Doğrulama gücü tek bir kuruma değil, bağımsız AI ajanlarından oluşan bir ağa dağıtılır.
- **Şeffaflık:** Her ajanın analiz adımları ve kullandığı kaynaklar açıkça raporlanır.
- **Özerklik:** Ajanlar, Agent Economy prensiplerine uygun olarak bağımsız ekonomik aktörler olarak tasarlanmıştır.

---

## Akademik Temeller

Bu proje, 2025–2026 yıllarında yayınlanan güncel akademik araştırmalara dayanmaktadır:

| Makale | Yıl | Katkı |
|--------|-----|-------|
| [The Agent Economy](https://arxiv.org/abs/2602.14219) — Xu | 2026 | Blockchain tabanlı otonom ajan ekonomisi mimarisi |
| [NANDA Index Architecture](https://arxiv.org/abs/2508.03101) — Wang vd. | 2025 | Merkeziyetsiz ajan keşfi ve Zero Trust güvenlik |
| [SREE Framework](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5415074) — Morin | 2025 | Epistemik sürüklenmeyi önleyen özyinelemeli doğrulama |
| [AI-driven Disinformation](https://www.frontiersin.org/articles/10.3389/frai.2025.1569115) — Romanishyn vd. | 2025 | Demokratik dayanıklılık için politika önerileri |
| [TruthChain](https://ieeexplore.ieee.org/abstract/document/11176464/) — Murugalakshmi vd. | 2025 | Blockchain tabanlı haber doğrulama sistemi |

---

## Özellikler

- **İddia Giriş Formu** — Kullanıcıların metin veya haber iddiası girebildiği ana sayfa formu
- **Çoklu AI Ajan Analizi** — 3 uzmanlaşmış ajan paralel olarak çalışır:
  - Kaynak Doğrulama Ajanı
  - Mantıksal Tutarlılık Ajanı
  - Çapraz Doğrulama Ajanı
- **Canlı Analiz Akışı** — Ajanların çalışma sürecini adım adım gösteren gerçek zamanlı arayüz
- **Konsensüs Mekanizması** — Ağırlıklı ortalama ile Proof of Reliability skoru hesaplama
- **Doğrulama Sonuç Raporu** — Her ajanın bulgularını, skoru ve nihai kararı gösteren detaylı rapor
- **Geçmiş Doğrulamalar** — Daha önce analiz edilen iddiaların veritabanında saklanması ve listelenmesi

### Karar Kriterleri

| Karar | Proof of Reliability | Açıklama |
|-------|---------------------|----------|
| **Doğrulandı** | ≥ 70 | İddia güvenilir kaynaklara dayanıyor, mantıksal tutarlı |
| **Şüpheli** | 40–69 | İddia belirsiz, çelişkili kaynaklar mevcut |
| **Yanlış** | < 40 | İddia güvenilir kaynaklarla çelişiyor, manipülasyon tespit edildi |

---

## Teknoloji Yığını

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend:** Node.js, Express, tRPC 11
- **Veritabanı:** MySQL (Drizzle ORM)
- **AI:** OpenAI API, Google Gemini API (invokeLLM ile soyutlanmış)
- **Mimari:** NANDA tabanlı çok ajanlı sistem, SREE epistemik doğrulama mantığı

---

## Kurulum

### Gereksinimler

- Node.js 18+
- pnpm
- MySQL veritabanı

### Adımlar

```bash
# Repoyu klonla
git clone https://github.com/<kullanici>/veritruth.git
cd veritruth

# Bağımlılıkları yükle
pnpm install

# Ortam değişkenlerini ayarla
cp .env.example .env
# .env dosyasını düzenle

# Veritabanı migrasyonlarını çalıştır
pnpm drizzle-kit migrate

# Geliştirme sunucusunu başlat
pnpm dev
```

---

## Ortam Değişkenleri

`.env.example` dosyasına bakın.

---

## Testler

```bash
pnpm test
```

---

## Cosmos Grants Uyumu

Bu proje, Cosmos Grants'in **Truth-seeking: Cosmos × FIRE Stream** programının şu hedefleriyle doğrudan uyumludur:

- **Gerçek Arayışı (Truth-seeking):** Yapay zeka destekli dezenformasyona karşı merkeziyetsiz doğrulama ağı
- **Merkeziyetsizlik:** Doğrulama gücü bağımsız AI ajanlarına dağıtılmış
- **Özerklik:** Agent Economy prensiplerine uygun ajan tasarımı
- **Açık Kaynak:** MIT lisansı ile tamamen açık kaynak

---

## Lisans

MIT License — Açık kaynak ve serbestçe kullanılabilir.

---

## Atıf

Bu proje, Cosmos Institute'un insanlığın gelişimi için gerçeği arayan, özerk ve merkeziyetsiz sistemlere olan inancından ilham almaktadır.
