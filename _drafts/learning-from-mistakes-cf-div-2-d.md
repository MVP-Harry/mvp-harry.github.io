---
layout: post
title: 'Learning From Mistakes: CF Div 2. D'
categories: [Competitive Programming, Learning From Mistakes]
tag: [competitive programming, learning from mistakes, cf]
math: true
---

## Intro
One of the most important ways to improve is to review the questions that I struggled/couldn't solve. In this post, I'm going to focus on [100 Div 2. D problems](https://earthshakira.github.io/a2oj-clientside/server/Ladder7.html). I hope to list all the problems that I had trouble solving, summarize the key learning, and where I got stuck.

## List of Div 2. D Problems That I Couldn't Solve

#### [126B - Password](https://earthshakira.github.io/a2oj-clientside/server/Ladder7.html)
<details>
    <summary>Spoiler</summary>
    * Key learning: KMP prefix function
    * Where I got stuck:
        + KMP prefix function (instead, I used a bogus dp solution)
        + How to deal with the suffix
    * Tags: string algorithms
</details>

#### [407B - Long Path](https://codeforces.com/problemset/problem/407/B)
<details>
    <summary>Spoiler</summary>
    * Key learning: read problem statement carefully
    * Where I got stuck:
        + Didn't realize that $p[i] <= i$, the key to solving the problem
        + Didn't come up with the dp solution either, even after reading the problem correctly
    * Tags: dp
</details>

#### [442B - Andrey and Problem](https://codeforces.com/problemset/problem/442/B)
<details>
    <summary>Spoiler</summary>
    * Where I got stuck:
        + Used a bogus dp solution without realizing that it's incorrect
        + Instead, it's necessary to derive a mathematical formula to prove that the optimal set of people is always the suffix of a sorted array
    * Tags: Math
</details>
