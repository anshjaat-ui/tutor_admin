# bazario Admin Panel (Separate App)

Ye poori tarah **alag project** hai — customer-facing `amazon-clone-frontend`
se koi lena dena nahi, apna khud ka deployment hoga (jaise `admin.tumhari-site.com`
ya `bazario-admin.vercel.app`), lekin wahi backend API use karta hai.

## Local setup

```
cd amazon-clone-admin
cp .env.example .env
npm install
npm run dev
```
Browser mein khulega: `http://localhost:5174`

`.env` mein `VITE_API_URL` apne backend (local ya Render) ke URL se set karo.

## Deploy karna (Vercel — naya, alag project banao)

1. Is `amazon-clone-admin` folder ko **alag GitHub repo** mein push karo
   (ya same repo mein, lekin Vercel project banate waqt Root Directory
   `amazon-clone-admin` set karna)
2. https://vercel.com/new pe jao → is repo ko import karo (naya project banega,
   tumhare customer-site wale project se bilkul alag)
3. Environment Variables mein:
   ```
   VITE_API_URL = https://tumhara-backend.onrender.com/api
   ```
4. Deploy karo — ek naya URL milega, jaise `bazario-admin.vercel.app`

## Sirf admin login kar sakte hain

Login form kisi bhi email/password se try hoga, lekin agar wo account
`role: "admin"` nahi hai, to error dega: "Ye account admin nahi hai."

Apne account ko admin banane ke liye: MongoDB Atlas → `users` collection →
apna user dhundo → `role` field ko `"customer"` se `"admin"` kar do.

## Features

- **Products** — list, add, edit, delete (image URL paste karke, koi file upload nahi)
- **Orders** — sab orders dekho, UPI payment claims ko manually confirm karo,
  order status update karo (pending → processing → shipped → delivered)

## Security note

Ye admin app customer site se localStorage share nahi karta (`admin_token` alag
key use karta hai), isliye ek hi browser mein customer aur admin dono account
se alag-alag login rakh sakte ho bina conflict ke.
