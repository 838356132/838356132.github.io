#!title:    Edison开发板
#!date:     2017-03-11
#!authors:  
#!cover:    
#!type:     C
#!tags:     

#!content

# 初始配置

首先，安装驱动并更新固件：

连接usb client（拨动开关下面的那个）至电脑，SSH登录Edison，ip地址一般是192.168.2.15。也可以利用无线网登录。

然后，利用wpa_cli连接wlan，步骤如下[1]：

```
 > add_network（返回X）
 > set_network X ssid "<你的AP的SSID>"
 > set_network X psk "<你的AP的密码>"
 > enable_network X
 > save_config
 > quit
```

添加软件仓库：
修改`cat /etc/opkg/base-feeds.conf`为

```
src/gz all http://repo.opkg.net/edison/repo/all
src/gz edison http://repo.opkg.net/edison/repo/edison
src/gz core2-32 http://repo.opkg.net/edison/repo/core2-32
```

安装必要软件：

```
opkg update
opkg install lighttpd-module-cgi
opkg install lighttpd-module-scgi
opkg install lighttpd-module-fastcgi
opkg install nodejs-npm
opkg install sqlite3
opkg install php
```

# PHP+lighttpd配置

修改`/etc/lighttpd.conf`，加入

```
server.modules += ( "mod_fastcgi" )
fastcgi.server = ( ".php" =>
  (( "socket" => "/tmp/php-fastcgi.socket",
    "bin-path" => "/usr/bin/php-cgi",
     "min-procs" => 1,
     "max-procs" => 1,
     "max-load-per-proc" => 4,
     "bin-environment" => (
     "PHP_FCGI_CHILDREN" => "2",
        "PHP_FCGI_MAX_REQUESTS" => "10000" ),
      "bin-copy-environment" => (
        "PATH", "SHELL", "USER" ),
      "broken-scriptfilename" => "enable",
     "idle-timeout" => 20
  ))
)
```

# 串口设置

> 本节参考
[https://communities.intel.com/thread/57321]()
[http://www.arduino.cn/thread-12344-1-1.html]()
[https://communities.intel.com/thread/54236]()

使用Arduino扩展板的话，串口（Arduino 0、1）对应的设备文件是`/dev/ttyMFD1`，但是直接使用是不行的。执行下列命令：

```
echo 214 > /sys/class/gpio/export 2>&1
echo high > /sys/class/gpio/gpio214/direction
echo low > /sys/class/gpio/gpio214/direction
echo 131 > /sys/class/gpio/export 2>&1
echo mode1 > /sys/kernel/debug/gpio_debug/gpio131/current_pinmux
echo 249 > /sys/class/gpio/export 2>&1
echo high > /sys/class/gpio/gpio249/direction
echo 1 > /sys/class/gpio/gpio249/value
echo 217 > /sys/class/gpio/export 2>&1
echo high > /sys/class/gpio/gpio217/direction
echo 1 > /sys/class/gpio/gpio217/value
echo out > /sys/class/gpio/gpio131/direction
echo 0 > /sys/class/gpio/gpio131/value
echo 130 > /sys/class/gpio/export 2>&1
echo mode1 > /sys/kernel/debug/gpio_debug/gpio130/current_pinmux
echo 248 > /sys/class/gpio/export 2>&1
echo low > /sys/class/gpio/gpio248/direction
echo 0 > /sys/class/gpio/gpio248/value
echo 216 > /sys/class/gpio/export 2>&1
echo in > /sys/class/gpio/gpio216/direction
echo in > /sys/class/gpio/gpio130/direction
echo high > /sys/class/gpio/gpio214/direction
```

控制安信可A6模块，通过串口向其发送AT指令。注意，系列指令的每条指令之间最好有1秒的延时。另外，使用A6模块时，由于A6模块耗电量较大，必须用交流电源适配器对Edison板子供电。

```:C
...
char CMGF[12] = "AT+CMGF=0\r\n";
char CMGS[13] = "AT+CMGS=<编码器计算出的短信长度>\r\n";
char text[74] = "<经PDU编码的短信内容>\x1a";
int cntr = 1;
while(cntr > 0) {
    write(fd, CMGF, strlen(CMGF));
    sleep(2);
      read(fd, buff, 64);printf("[sms]%s\n", buff);
    write(fd, CMGS, strlen(CMGS));
    sleep(2);
      read(fd, buff, 64);printf("[sms]%s\n", buff);
    write(fd, text, strlen(text));
    sleep(2);
      read(fd, buff, 64);printf("[sms]%s\n", buff);
    cntr--;
}
...
```

# 解决Python requests安全连接问题

[http://stackoverflow.com/questions/29134512/insecureplatformwarning-a-true-sslcontext-object-is-not-available-this-prevent]()

执行`pip install requests[security]`

# 关于扩展板的I2C

使用Arduino扩展底板时，其上引出的I2C对应于`/dev/i2c-6`设备文件。

# 参考资料

- [http://www.360doc.com/content/12/1231/11/9298584_257299004.shtml]()
- Intel Edison智能硬件开发指南
- [https://github.com/cheaven/edison_native]()
- [http://www.dfrobot.com.cn/community/thread-12877-1-1.html]()

