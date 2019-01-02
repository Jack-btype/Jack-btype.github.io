---
layout: post
title: "[Leetcode]No.2 Add Two Numbers"
description: "record of solving program Problems"
subtitle: "leetcode"
create-date: 2019-01-02
update-date: 2019-01-02
header-img: ""
author: "Jack-btype"
tags:
    - LeetCode
---

# [Leetcode]No.2 Add Two Numbers

> 2019-01-02

## 0. Problem

You are given two **non-empty** linked lists representing two non-negative integers. The digits are stored in **reverse order** and each of their nodes contain a single digit. Add the two numbers and return it as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.

**Example:**

```c++
Input: (2 -> 4 -> 3) + (5 -> 6 -> 4)
Output: 7 -> 0 -> 8
Explanation: 342 + 465 = 807.
```

## 1. My thought

​	抱着避免一个数字过长导致需要遍历很多次的想法。我设计了如下算法	：

1. 先算出两个链表的长度`L1Size`,`L2Size`，以更长的链表作为结果链表。
2. 假设`L1Size`更小，用for循环计算出在第一个和第`L1Size`两个链表的数值对应以及进位`carry`之和。如果结果大于10，则将进位`carry`加一。
3. 计算结束之后，如果两个链表长度相同，则看有没有进位，即`carry`的值是否大于0。如果大于0，则创建一个新的`ListNode`，赋值为`carry`的值。如果没有，则无需操作。
4. 如果两个链表长度不同，即`L2Size > L1Size`，则对剩下的`l2`的节点逐个加上`carry`的值，直到`carry`的值为0。如果一直到第`L2Size`个节点计算完之后，`carry`的值还是大于0，则创建一个新的`ListNode`，赋值为`carry`的值。
5. 最后将`l2`的地址返回即为所求。



​	但是，由于水平有限，未能实现这个想法，在TestCase为

```c++
[9,9]
[1]
```

​	中我得到的结果跟正确答案对比如下：

```
[0,1]
[0,0,1]
```

​	由于代码被我删除了，现在也找不到bug所在，我只能先从简单的方法入手将这道题解决。

## 2.Simple Version

​	代码的简单思路为：

	1. 创建一个新的空链表来存放结果。

 	2. 从头开始遍历两个加数链表`l1`和`l2`，如果当前节点为空，则将值赋为0。
 	3. 计算结果`sum = l1->val + l2->val + carry`
 	4. 然后从头开始将节点的值`sum % 10`插入空链表后面。这里要注意题目所设计的链表不是带头结点的链表，需要对第一个节点进行分别处理。即检测当前遍历结果链表的指针`tempRet`是否为空，如果是空的，则将`result`指针赋值为一个新的节点的地址，该节点的值为`sum % 10`，然后将`tempRet`指向`result`即可。（注意是将`result`指针赋值为新的节点，而不是将`tempRet`赋值为新的节点，后者会导致返回的`result`指针为空）
 	5. 然后计算`carry = sum / 10`。
 	6. 重复步骤2，3，4，5，直到两个指向`l1`和`l2`的遍历指针都为空时停止。
 	7. 最后返回结果链表`result`。

```c++
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        ListNode* result = NULL;
        ListNode* tempL1 = l1;
        ListNode* tempL2 = l2;
        ListNode* tempRet = result;
        int carry = 0;
        
        while (tempL1 != NULL || tempL2 != NULL)
        {
            int x, y;
            if (tempL1 != NULL)
            {
                x = tempL1->val;
            }
            else
            {
                x = 0;
            }
            if (tempL2 != NULL)
            {
                y = tempL2->val;
            }
            else
            {
                y = 0;
            }
            
            int sum = carry + x + y;
            carry = sum / 10;
            
            if (tempRet == NULL)
            {
                result = new ListNode(sum % 10);
                tempRet = result;
            }
            else
            {
                tempRet->next = new ListNode(sum % 10);
                tempRet = tempRet->next;
            }
            if (tempL1 != NULL) tempL1 = tempL1->next;
            if (tempL2 != NULL) tempL2 = tempL2->next;
        }

        if (carry > 0)
        {
            tempRet->next = new ListNode(carry);
        }
        return result;
    }
};
```

结果如下，虽然能过，但是效率并不理想。

![leetcode_No1_1](https://raw.githubusercontent.com/Jack-btype/Jack-btype.github.io/master/img/leetcode_No2_1.PNG)





### 3. 网上大神的解法

​	实现了空间需求为$O(1)$的算法。大致思路应该和我一开始的思路差不多，学习一下他的实现。

​	代码如下：

```C++
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        ListNode *tmp;
        ListNode *p = l1;
        ListNode *q = l2;
        bool h1 = true;
        short carry = 0;
        short cur = 0;
        while(h1 || q != NULL || carry != 0){
            cur = carry;
            if(h1){
                cur += p->val;
            }
            if(q!=NULL){
                cur += q->val;
                q = q->next;
            }
            p->val = cur % 10;
            carry = cur / 10;
            if(p->next == NULL){
                p->next = l2;
                h1 = false;
            }
            tmp = p;
            p = p->next;
        }
        tmp -> next = NULL;
        return l1;
    }
};
```

​	虽然在空间上进行了优化，但是时间复杂度上并没有变化，所以成绩和上边的差不多：

![leetcode_No1_2](https://raw.githubusercontent.com/Jack-btype/Jack-btype.github.io/master/img/leetcode_No2_2.PNG)

## 4. 总结

​	由于第二种方法在记忆和理解方面都稍有难度，我决定以后碰到类似的题目时先使用第一种方法，在能够使用一定量的空间的前提下，第一种方法更加好写，易懂。