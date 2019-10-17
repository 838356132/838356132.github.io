
#!title:    为Galileo增加关机按键
#!date:     2017-10-22
#!authors:  Mikukonai
#!cover:    
#!type:     原创
#!tags:     Galileo,物联网

#!content

> 突然断电会损坏计算机的文件系统，甚至丢失数据，Galileo也不例外。前段时间，由于频繁的强行断电关机，造成Galileo的文件系统损坏，具体表现是部分shell命令会报IO错误，sqlite数据库损坏，等等。但是，如果每次都通过SSH执行`poweroff`命令来关机，又非常麻烦。因此，这里将板子上的reset按钮改造成一个关机按钮：短按仍然是重启sketch，而长按则执行`poweroff`关机。

下文描述的Galileo一代的解决方案。二代原理类似。

# GPIO访问方法

Reset键对应的Linux GPIO编号是53（可查看Arduino交叉编译工具链目录`./variants/galileo_fab_d/variant.cpp`得知），可通过以下方式读取其值：

```
# 用户态映射
echo 53 > /sys/class/gpio/export
# 设置端口方向
echo in > /sys/class/gpio/gpio53/direction
# 读取端口状态
cat /sys/class/gpio/gpio53/value
```

Reset键带有上拉电阻，按下则拉低，因此读到“1”为释放状态，读到“0”为按下状态。

# 编写轮询脚本

可编写脚本轮询gpio53，若连续多次读取gpio53都是“0”，意味着Reset键被按下并保持了一段时间，时间到即可执行`poweroff`命令以关机。

脚本`galileo_shutdown_daemon.sh`内容如下：

```
#!/bin/sh
keepgoing=true
counter=0
while $keepgoing
do
	value=`cat /sys/class/gpio/gpio53/value`
	if [ "$value" == "0" ]; then
		echo "$counter"
		let "counter=counter+1"
		flag=`expr $counter % 2`
		if [ "$flag" == "0" ]; then
			echo 1 > /sys/class/gpio/gpio3/value
		else
			echo 0 > /sys/class/gpio/gpio3/value
		fi
		if [ "$counter" == "20" ]; then
			echo `uname`
		fi
	else
		counter=0
	fi
	usleep 50000
done
```

# 设定启动服务

Intel官方提供的IoT Devkit版本的操作系统采用systemd管理开机启动的诸多服务。按照以下步骤添加`galileo-shutdown-daemon.service`服务并启动之：

首先，将刚刚编写的脚本`galileo_shutdown_daemon.sh`移动到`/opt/cln/galileo`。当然移动到其他地方也没问题，只要和后面一致就可以。随后，在`/lib/systemd/system`中添加文件`galileo-shutdown-daemon.service`，内容如下：

```
[Unit]
Description=Galileo Poweroff Daemon

[Service]
Type=simple
ExecStart=/bin/sh  /opt/cln/galileo/galileo_shutdown_daemon.sh

[Install]
WantedBy=multi-user.target
```

接下来执行以下脚本启用该服务。

```
systemctl enable galileo-shutdown-daemon.service
```

最后reboot，如果一切正常的话，即实现长按Reset关机的功能。

# 参考资料

---

+ [http://www.csksoft.net/blog/post/304.html]()
+ [http://www.csksoft.net/blog/post/306.html]()
+ [http://www.ruanyifeng.com/blog/2016/03/systemd-tutorial-commands.html]()

