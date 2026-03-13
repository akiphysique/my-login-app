# MATAKITE – Product Specification (Claude Code Reference)

## Project Overview

**Service Name:** マタキテ (matakite.jp)  
**Operator:** Aki Physique (akiphysique.com)  
**Contact:** info@matakite.jp / no-reply@matakite.jp  
**Pricing:** ¥2,000/month per store (unlimited customers)  
**Stack:** Webアプリ（スマホ操作を最優先。PCでも利用可）

### Core Purpose

紙の回数券をデジタル化する回数券アプリ。小規模なサロン・パン屋・ジム・整体院などを対象とする。

### 対象ユーザーイメージ

**店舗（契約者）**
- 小規模なサロン・パン屋・ジム・整体院など
- スタッフ1〜5名程度
- ITツールに不慣れなオーナーが多い
- 紙の回数券を使っていたが、デジタル化したい
- PCを持たない店舗も多いため、スマホで完結できることが重要

**お客様（消費者）**
- 近所の常連客が中心
- スマホは使えるが、難しい操作は苦手な層も多い
- 「また来てね」と言われるような、温かい関係性

### Design Principles

- Zero-config onboarding; no support needed
- Reproduce the feel of paper cards digitally
- Prevent fraud through UI transparency, not complex rules
- Reduce cognitive load for both staff and customers
- One smartphone shared among all staff

---

## User Roles

|Role         |Auth          |Notes                                |
|-------------|--------------|-------------------------------------|
|Store (Admin)|Login required|1 contract = 1 store                 |
|Customer     |Login required|Belongs to exactly 1 store           |
|Staff        |No account    |Name entered manually per transaction|

**Critical constraint:** `store_id` is the isolation key. Customers are bound to one store permanently. Cross-store access is impossible.

---

## Data Models

### stores

```
store_id   UUID        Primary key
name       string      Store name
address    string      Full address
created_at datetime
```

### users (customers)

```
user_id         UUID        Primary key
store_id        UUID        FK → stores (enforced server-side)
name            string
email           string
phone           string
points          int         Current point balance
memo            string      Optional
registered_by   string      "store"（店舗登録）or "self"（QR自己登録）
created_at      datetime
```

### point_logs

```
log_id      UUID       Primary key
user_id     UUID       FK → users
store_id    UUID       FK → stores (denormalized for fast queries)
amount      int        Points added (positive integer)
staff_name  string     Required — entered manually per transaction
memo        string     Optional (e.g., "紙カード移行分")
created_at  datetime
```

---

## API Specification

### POST /api/users — Register Customer（店舗による登録）

**Auth:** Store session required

|Field|Required|Notes|
|-----|--------|-----|
|name |✅       |     |
|email|✅       |     |
|phone|✅       |     |
|memo |❌       |     |

**Server behavior:**

- `store_id` is injected from authenticated session (never from client)
- `registered_by` = "store" を自動付与
- Cross-store registration is impossible by design

---

### POST /api/users/self-register — Register Customer（QR自己登録）

**Auth:** 有効な store_token（QRコードに埋め込まれたワンタイムトークン）

|Field|Required|Notes|
|-----|--------|-----|
|name |✅       |     |
|email|✅       |     |
|phone|✅       |     |

**Server behavior:**

- `store_token` からstore_idを検証・取得（クライアントからstore_idは受け取らない）
- `registered_by` = "self" を自動付与
- トークンは店舗ごとに発行。失効・再発行が可能

---

### GET /api/stores/qr — QRコード取得

**Auth:** Store session required

- 店舗固有の自己登録URLを含むQRコードを返す
- URLには store_token を含む
- 店舗のスマホやプリント紙に表示して使用

---

### POST /api/points/add — Add Points

**Auth:** Store session required

|Field     |Required|Notes                       |
|----------|--------|----------------------------|
|user_id   |✅       |                            |
|amount    |✅       |Positive integer            |
|staff_name|✅       |Free text, no account needed|
|memo      |❌       |                            |

**Server behavior:**

- Validate `user.store_id === session.store_id` — reject with error if mismatch
- Append to `point_logs`
- Update `users.points += amount`

---

## Screen Specifications

### Customer View

**Header (prominent):**

```
⭕️⭕️サロン
東京都杉並区荻窪1-2-3
```

**Content:**

- Current point balance
- Point history (log list)
- Visit history (optional)
- Logout button

---

### Store Admin View

**Header:**

```
管理中：⭕️⭕️サロン（東京都杉並区荻窪1-2-3）
```

**Navigation:**

- 顧客一覧 (Customer list)
- 顧客登録 (Register customer) ← 店舗が1件ずつ入力する方法
- QR登録 (QR self-registration) ← QRコードを表示してお客様が自己登録する方法
- ポイント付与 (Add points) ← Most important
- ポイント履歴 (Point history)
- 設定 (Settings)

---

### Customer Registration Screen（店舗入力）

```
登録先店舗：⭕️⭕️サロン（東京都杉並区荻窪）
※ store_id はサーバー側で自動付与

Fields:
- 名前 [required]
- メール [required]
- 電話番号 [required]
- メモ [optional]
```

---

### QR自己登録画面（店舗側）

```
お客様にこのQRコードをスキャンしていただいてください。

[QRコード表示エリア]

※ お客様のスマホからスキャンすると登録フォームが開きます
```

### QR自己登録フォーム（お客様側・スキャン後に表示）

```
⭕️⭕️サロン への会員登録

Fields:
- お名前 [required]
- メールアドレス [required]
- 電話番号 [required]

[登録する]
```

---

### Add Points Screen (MOST CRITICAL)

```
操作スタッフ名（必須）:
[____________]          ← Free text, entered every time

お客様: [山田太郎]

現在のポイント: 120 pt

付与ポイント:
[  10  ] pt
Quick buttons: +10 / +20 / +50 / +100

メモ（任意）:
[紙カード移行分]

[ポイントを付与する]
```

**UX rationale:**

- Staff name entered manually = mirrors paper card signature culture
- Deters internal fraud without complex systems
- Supports shared single-device operation

---

### Point History (Admin)

```
2026/03/11　＋100 pt
理由：紙カード移行分
操作：スタッフA

2026/03/10　＋10 pt
理由：来店ポイント
操作：スタッフB
```

---

## お客様登録方法（2パターン対応）

| 方法 | 説明 | 向いているケース |
|------|------|----------------|
| A：店舗が1件ずつ入力 | 店舗スタッフが管理画面から入力 | ITが苦手なお客様、紙カード移行時 |
| B：QRコード自己登録 | QRをスキャンしてお客様が自分で入力 | スマホに慣れたお客様、来店時のスムーズな登録 |

両方の方法を実装し、店舗が状況に応じて使い分けられるようにする。

---

## Fraud Prevention Summary

|Mechanism                 |Implementation                                             |
|--------------------------|-----------------------------------------------------------|
|Store isolation           |`store_id` enforced server-side on all writes              |
|Customer mixing prevention|Customers cannot be reassigned between stores              |
|Transparency              |Store name + address displayed prominently on all screens  |
|Staff accountability      |`staff_name` required and logged on every point transaction|
|Concurrent login          |Allowed intentionally (shared device model)                |
|QR token validation       |自己登録時はstore_tokenでstore_idを検証。直接指定不可      |

---

## Paper Card Migration Flow

1. Count remaining points on customer's physical card
1. Open Add Points screen
1. Enter `staff_name`
1. Enter total carry-over points
1. Set `memo` = `"紙カード移行分"`
1. Submit → history visible to customer immediately

---

## Implementation Notes

- **スマホ操作を最優先**に最適化すること（PCでも使えるようにしておく）
- All screens must prominently display store name + full address
- `store_id` must never be accepted from client input — always derive from session
- `staff_name` field must be required (cannot be blank) on point transactions
- Mobile-first layout; target: usable on a single shared smartphone
- No staff account system — staff identity is captured via free-text name only
