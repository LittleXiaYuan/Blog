---
title: NewStarCTF2024-Crypto Writeup
date: 2024-10-05 21:11:21
updated: 2024-10-07 19:22:55
slug: newstarctf-crypto-writeup
categories:
  - 未分类
---

<blockquote>
天下熙熙，皆为利来；天下攘攘，皆为利往。
</blockquote>
<h2>前言</h2>
<p>今年这场比赛真的很精彩，作为新生赛，第一轮Crypto题目出的很好，覆盖知识点也广！</p>
<p>开篇先给各位✌嗑个头，呜呜呜各位✌下手轻点要抢不到一血啦哇呜呜呜~！(滚来滚去)
<a href="https://me.owo.today/wp-content/uploads/2023/09/IMG_20230926_214301_217-300x184.jpg" title="跟去年一样（"><img src="https://me.owo.today/wp-content/uploads/2023/09/IMG_20230926_214301_217-300x184.jpg" alt="跟去年一样（" title="跟去年一样（" /></a></p>
<h2>Crypto</h2>
<h3>1.Xor</h3>
<p>题目如下：</p>
<pre><code class="language-python">#As a freshman starting in 2024, you should know something about XOR, so this task is for you to sign in.

from pwn import xor
#The Python pwntools library has a convenient xor() function that can XOR together data of different types and lengths
from Crypto.Util.number import bytes_to_long

key = b'New_Star_CTF'
flag='flag{*******************}'

m1 = bytes_to_long(bytes(flag[:13], encoding='utf-8'))
m2 = flag[13:]

c1 = m1 ^ bytes_to_long(key)
c2 = xor(key, m2)
print('c1=',c1)
print('c2=',c2)

'''
c1= 8091799978721254458294926060841
c2= b';:\x1c1<\x03>*\x10\x11u;'
'''</code></pre>
<p>分析：c1是一个长整数，应该是表示前13个字符与密钥进行XOR后的结果
c2是一个字节串，表示剩下的部分与密钥进行XOR后的结果</p>
<p>c1是m1与key进行XOR的结果。
我们可以通过再次进行XOR来还原 m1，然后将 m1 转换回字节串
c2同理</p>
<p>exp：
Part1(回转解密)：</p>
<pre><code class="language-python">#As a freshman starting in 2024, you should know something about XOR, so this task is for you to sign in.

from pwn import xor
#The Python pwntools library has a convenient xor() function that can XOR together data of different types and lengths
from Crypto.Util.number import bytes_to_long

key = b'New_Star_CTF'
flag='flag{*******************}'

m1 = bytes_to_long(bytes(flag[:13], encoding='utf-8'))
m2 = flag[13:]

c1 = m1 ^ bytes_to_long(key)
c2 = xor(key, m2)
print('c1=',c1)
print('c2=',c2)

'''
c1= 8091799978721254458294926060841
c2= b';:\x1c1<\x03>*\x10\x11u;'
'''
</code></pre>
<p>Part2（还原编码以及组合Flag）：</p>
<pre><code class="language-python">from pwn import xor
from Crypto.Util.number import bytes_to_long, long_to_bytes

key = b'New_Star_CTF'
c1 = 8091799978721254458294926060841
c2 = b';:\x1c1<\x03>*\x10\x11u;'

# 解密 c1
m1 = c1 ^ bytes_to_long(key)
part1 = long_to_bytes(m1)

# 解密 c2
part2 = xor(key, c2)

# 组合还原的部分
flag = part1 + part2
print(flag.decode('utf-8'))
</code></pre>
<p>得到Flag：</p>
<pre><code class="language-bash">flag{0ops!_you_know_XOR!}</code></pre>
<h3>Base</h3>
<p>题目：4C4A575851324332474E324547554B494A5A4446513653434E564D444154545A4B354D45454D434E4959345536544B474D5134513D3D3D3D</p>
<p>这个没什么好说的，Base16-Base32-Base64</p>
<p>Flag：</p>
<pre><code class="language-shell">flag{B@sE_0f_CrYpt0_N0W}</code></pre>
<h3>一眼秒了</h3>
<p>** 一眼顶真，鉴定为纯纯的RSA</p>
<p>有两个思路，第一个思路，欢迎使用因式分解~你不知道p和q的值~~ 所以来经典的因式分解吧喵w！不要用什么大素数死磕啦</p>
<p>除了这之外，我还想了个邪道，好像可以用费马分解拿到p和q的近似值（</p>
<p>exp：</p>
<pre><code class="language-python">from sympy import factorint
from Crypto.Util.number import *
from gmpy2 import *

n = 52147017298260357180329101776864095134806848020663558064141648200366079331962132411967917697877875277103045755972006084078559453777291403087575061382674872573336431876500128247133861957730154418461680506403680189755399752882558438393107151815794295272358955300914752523377417192504702798450787430403387076153
c = 48757373363225981717076130816529380470563968650367175499612268073517990636849798038662283440350470812898424299904371831068541394247432423751879457624606194334196130444478878533092854342610288522236409554286954091860638388043037601371807379269588474814290382239910358697485110591812060488786552463208464541069
e = 65537

factors = factorint(n)
p, q = list(factors.keys())

#私钥d
phi = (p - 1) * (q - 1)
d = invert(e, phi)

# 解密消息
m = powmod(c, d, n)
flag = long_to_bytes(m)
print(flag)
</code></pre>
<p>得到Flag：</p>
<pre><code class="language-shell">flag{9cd4b35a-affc-422a-9862-58e1cc3ff8d2}</code></pre>
<h3>4 Strange King</h3>
<p>** 一眼顶真，鉴定为这个真是顶真（</p>
<p>分析：与问题描述
人话：加密信息如下：ksjr{EcxvpdErSvcDgdgEzxqjql}
主加密字符串可能使用了凯撒密码变种。在分析主字符串ksjr时，我猜它可能是 flag的加密结果，其中每个字符的位移分别为 5, 7, 9, 11。这表明了出题人可能采用了递增位移的策略。
针对括号内的字符串 "RngcugFqPqvUvqrNgctkpi"，我们决定尝试使用凯撒密码的递增位移方法进行解密。所以我尝试了从位移数 1 到 25 的所有可能。</p>
<p>Exp：</p>
<pre><code class="language-python">def decrypt_caesar_cipher(text, shift):
    decrypted_text = ""
    for char in text:
        if char.isalpha():
            if char.islower():
                decrypted_text += chr((ord(char) - shift - 97) % 26 + 97)
            else:
                decrypted_text += chr((ord(char) - shift - 65) % 26 + 65)
        else:
            decrypted_text += char
    return decrypted_text

encrypted_string = "RngcugFqPqvUvqrNgctkpi"
for shift in range(1, 26):
    decrypted_text = decrypt_caesar_cipher(encrypted_string, shift)
    print(f" {shift}: {decrypted_text}")
</code></pre>
<p>运行之后，我发现在位移为2时，解密结果为 “PleaseDoNotStopLearing”，所有结果就这个是正常人话，所有尝试一下，success！（</p>
<p>Flag：</p>
<pre><code class="language-shell">flag{PleaseDoNotStopLearing}</code></pre>
<p>第一周的题目真好玩w，已经开始期待后续的密码学题目惹！
什么？Rev？Pwn？根本不会！<del>密码学和算法万岁！！！</del> (不是)</p>
<p>事已至此，先吃饭吧!
<del>我八胃大，无需多盐</del>
<a href="https://me.owo.today/wp-content/uploads/2024/10/1728066824-1727779300007.png" title="我八胃大("><img src="https://me.owo.today/wp-content/uploads/2024/10/1728066824-1727779300007.png" alt="我八胃大(" title="我八胃大(" /></a></p>
