# Feature Spec: Payment Arrangement
**Type:** Requirements Only
**Design:** Designer ke discretion par
**Date:** 2026-03-31

---

## Problem

Abhi payment flow mein yeh clear nahi hota ke order ka payment kaise hoga — cash hai, pending hai, ya koi borrow kar raha hai. Order history mein bhi yeh information nahi hoti.

---

## Solution — Option A (Recommended)

`orders` table mein ek naya field add karo: `payment_arrangement`

---

## Data Model

### New Field

```
orders.payment_arrangement
Type: enum
Values:
  - pending   → payment baad mein hogi
  - borrow    → kisi ne borrow kiya / udhaar
  - cash      → abhi cash payment hui
```

### Payment Records Rule

> Payment record **sirf tab banega** jab `payment_arrangement = cash` ho.
> `pending` aur `borrow` ke liye koi payment record nahi banega.

---

## User Flow — Payment Page

Payment page par **3 buttons** dikhao:

```
[ Cash ]     [ Pending ]     [ Borrow ]
```

### Cash select karo toh:
- Amount field dikhao
- Split option dikhao (multiple parties mein divide karna ho toh)
- Payment record create hoga

### Pending select karo toh:
- Seedha proceed — koi amount/split nahi
- Koi payment record nahi banega

### Borrow select karo toh:
- Seedha proceed — koi amount/split nahi
- Koi payment record nahi banega

---

## Order History

Order list / detail mein `payment_arrangement` clearly dikhao:

| Order | Payment Arrangement |
|---|---|
| #1001 | Cash |
| #1002 | Pending |
| #1003 | Borrow |

---

## Requirements Summary

| # | Requirement |
|---|---|
| R1 | `orders` table mein `payment_arrangement` enum column add karo (pending / borrow / cash) |
| R2 | Payment page par 3 buttons honge: Cash, Pending, Borrow |
| R3 | Cash select hone par amount + split fields dikhenge |
| R4 | Pending / Borrow select hone par amount/split fields nahi dikhenge |
| R5 | Payment record sirf Cash case mein create hoga |
| R6 | Order history mein payment_arrangement clearly display hoga |
| R7 | Database migration required hai naye column ke liye |

---

## Out of Scope

- Design / UI measurements — designer decide karega
- Visual styling / colors — designer decide karega
- Split logic ka internal implementation — alag spec mein
