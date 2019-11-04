#!title:    MP3编解码原理
#!date:     2019-11-03
#!authors:  Mikukonai
#!cover:    
#!type:     C
#!tags:     

#!content

> 正在调查研究。本文是学习成果的记录。

# 待整理的笔记

## Analysis Subband Filterbank 分析子带滤波器组

20191104

分析子带滤波器组，用于编码器。

首先明确输入和输出形式。对于每帧1152采样，划分成36组长度为32点的采样段，将每段**分别**输入滤波器，执行36次32点子带滤波，得到长度为32的频域结果。则36个采样段可以得到36组长度为32的频域结果。

频域结果的每一点对应32个子带之一，所以换一个视角，子带滤波器组的输出结果是：32个长度为36的子带滤波结果，每个结果对应一个频带。

至于子带滤波器，它的信号流图以及算法参数都在11172标准中有定义，直接照抄就可以。

![信号流图](http://wx3.sinaimg.cn/large/450be1f5gy1g8m3hdg4tgj23342bcjzo.jpg)

# MP3标准概述

全称 MPEG-1 Layer Ⅲ，对应国际标准为 ISO/IEC 11172-3。

# 心理声学模型

舍弃人耳无法感知的冗余信息：声压级（SPF），听阈（静音门限）和痛阈，时域掩蔽和频域掩蔽，关键频带（critical bands），第二心理声学模型，信掩比（SMR）

# 滤波与变换编码

子带滤波器组，改进的离散余弦变换（MDCT），长窗口和短窗口，前回声抑制

# 量化与熵编码

非均匀量化，Huffman编码

# 编码参数与码率控制

CBR/ABR/VBR，码率控制环路

# 比特流结构

ID3v2等

# 现有的编解码器产品

LAME

# 参考资料

MP3资料收集网站，有许多论文和技术资料可供下载：[http://www.mp3-tech.org/]()

标准文档当然是最高依据：

- [1] ISO/IEC 11172 - Coding Of Moving Picture And Associated Audio For Digital Storage Media At Up To About 1,5 Mbit/s - Part 3: Audio

这篇文章有助于理解ISO11172标准文档：

- [2] Pan D . Tutorial on MPEG/audio compression[J]. IEEE Multimedia, 1995, 2(2):60-74.

为数不多的质量较高的中文论文，原理与实现并重，可供快速入门：

- [3] 張芷燕. MP3編碼法之研究與實現

一篇适合入门的科普向文章：

- [4] Rassol Raissi. The Theory Behind Mp3

这篇文章论述了感知音频编码的基本原理，可供参考：

- [5] Painter T , Spanias A . Perceptual coding of digital audio[J]. Proceedings of the IEEE, 2000, 88(4):451-515.

这篇文章介绍了人类听觉系统的一些规律，或许有用：

- [6] D Robinson. The Human Auditory System

随着研究的继续，本列表会不断更新。
