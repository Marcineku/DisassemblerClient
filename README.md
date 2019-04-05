# Disassembler Client

![alt text](https://raw.githubusercontent.com/Marcineku/DisassemblerClient/master/Preview1.png)

![alt text](https://raw.githubusercontent.com/Marcineku/DisassemblerClient/master/Preview2.png)

# Description
It can disassemble x86 instructions written as a text or uploaded as a x86 PE file.
Disassembly and flow of control graph starts at applications entry point.
Server was written using Java and Spring framework, client was written in HTML/CSS/TypeScript using Angular framework with Angular Materials
and packages like clusterize.js for clustering disassembly window scroll area (without it DOM gets insanely big really fast) and d3.js.

# App footage
https://youtu.be/kdIED5CZIVM

# Important
As for client:
After downloading all dependencies, go to clusterize.js package -> clusterize.css -> .clusterize-scroll and change
max-height from 200px to something like 1200px or window with disassembly will be very short.

As for server:
You need to install lombok plugin or your screen will be red.
