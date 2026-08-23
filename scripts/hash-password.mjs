// APP_PASSWORD_HASH に設定する値を生成する。
// 使い方: node scripts/hash-password.mjs "パスワード"
import { scryptSync, randomBytes } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('使い方: node scripts/hash-password.mjs "パスワード"');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);
console.log(`${salt.toString("hex")}:${hash.toString("hex")}`);
