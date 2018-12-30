---
layout: post
title: "[Leetcode]No.1 Two sums"
description: "record of solving program Problems"
subtitle: "leetcode"
create-date: 2018-12-31
update-date: 2018-31-31
header-img: ""
author: "Jack-btype"
tags:
    - LeetCode
---

# [Leetcode]No.1 Two sums

> 2018-12-31

## 1. Naive Solution

​	使用两重for循环进行遍历，时间复杂度为$O(n^2)$.

​	代码如下：

```c++
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
       vector<int> toReturn(2);
       for (int i = 0; i < nums.size() - 1; i++)
       {
           for (int j = i + 1; j < nums.size(); j++)
           {
               if (nums[i] + nums[j] == target)
               {
                   return vector<int> {i, j};
               }
           }
       }
       return toReturn;
    }
};
```

![leetcode_No1_1](https://raw.githubusercontent.com/Jack-btype/Jack-btype.github.io/master/img/leetcode_No1_1.PNG)

​	附录：

​	这里简单介绍一下C++中`vector`的创建方法：

```C++
vector():创建一个空vector。
vector(int nSize):创建一个vector,元素个数为nSize。
vector(int nSize,const t& t):创建一个vector，元素个数为nSize,且值均为t。
vector(const vector&):复制构造函数。
vector(begin,end):复制[begin,end)区间内另一个数组的元素到vector中。
vector {x, y} 新建一个两个元素，值分别为x，y的数组。 

这里用到了两种方法：
vector<int> toReturn(2); // 新建一个长度为2的数组，值为默认的0
vector<int> {i, j}; // 新疆一个长度为2的数组，数值分别为i，j
```

### 2. 网上大神的解法

​	使用了unorder_map这个容器。

​	大概思路为总共只遍历一次，设当前的元素为n，如果map里面没有对应能够组合成target的元素（即值为target-n的元素），那么就把当前元素压进去map。一直遍历下去就能找到对应的元素了。

​	代码如下：

```C++
#include <unordered_map>
#include <iostream>
#include <vector>

using std::unordered_map;
using std::vector;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int,int> hash;
        auto end = hash.end();
        vector<int> solution(2, 0);
        
        for (int i = 0; i < nums.size(); i++)
        {
            auto find = hash.find(target-nums[i]); // 寻找能够组成target的另一个元素
            
            if (find == end)
            {
                hash.emplace(nums[i], i); // 向map插入【元素，数组位置】的pair
            }
            else
            {
                solution = {find->second, i};
                return solution;
            }
        }
    }
};
```

​	效果拔群：

![leetcode_No1_2](https://raw.githubusercontent.com/Jack-btype/Jack-btype.github.io/master/img/leetcode_No1_2.PNG)