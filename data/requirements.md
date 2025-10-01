# thpatch.net backup project

## 요구 사항

- https://www.thpatch.net/wiki/Touhou_Patch_Center:Main_page 의 내용을 확인하세요.
- 우리는 위의 내용에 있는 게임들 중에서 TH06부터 TH20까지의 게임들에 대해서만 다룹니다.
- 각 게임에 대해서 다음의 정보를 md파일로 저장하기를 원합니다.
  - 다음은 예시입니다.
    - 동방홍마향 (https://www.thpatch.net/wiki/Th06 )
    - 위 링크에서는 다음의 정보를 포함하고 있습니다.
      - [omake.txt](https://www.thpatch.net/wiki/Th06/omake.txt/ko)
      - [HTML Manual](thpatch.net/wiki/Special:MyLanguage/th06/HTML_Manual)
      - [Music](https://www.thpatch.net/wiki/Th06/Music/ko)
      - [Reimu's Scenario](https://www.thpatch.net/wiki/Special:MyLanguage/th06/Reimu%27s_Scenario)
      - 기타 등등 시나리오 혹은 대사집
    - Images의 정보는 제외해도 괜찮습니다.
- 각 게임에 대해서 정보를 가지고 오면서 각각의 파일의 영어/일본어/한국어 버전이 존재하는지 파악하고 각 언어를 가지고 오는 것을 목표로 합니다.

## 요구 사항

- 폴더 구조는 다음과 같습니다.
- thxx/
  - thxx.md (게임에 대한 일반적인 정보)
  - omake.txt/
    - en.md
    - ja.md
    - ko.md
  - HTML_Manual/
    - en.md
    - ja.md
    - ko.md
  - Music/
    - en.md
    - ja.md
    - ko.md
  - Reimus_Scenario/
    - en.md
    - ja.md
    - ko.md
  - 기타 등등
- 최상단 폴더에는 README.md파일이 존재하며, 한국어 영어 일어와, 각 시리즈와 현재 가지고 온 데이터의 validate여부를 표기합니다.
- 만약 한국어가 없다면 각 폴더에의 README.md파일에 "한국어 번역이 존재하지 않습니다." 라고 표기합니다.
  - 예를 들어서 [th20](https://www.thpatch.net/wiki/Th20/Reimu_Shintoism_Wind_Extra/ko)를 보면 한국어가 없는 것을 확인할 수 있습니다.
- script로 가지고 와도 괜찮고, mediawiki api를 이용해도 괜찮습니다. 다만 media wiki로는 퍼올 수 없는 데이터도 있을 것 같으므로, 내용을 잘 파악해서 가지고 와주세요.
- reference.txt는 다른 요구사항입니다. 각 시리즈마다, 캐릭터 정보, 음악 제목, 게임 타이틀 같은 정보를 알 수 있습니다. 이 정보도 md파일로 저장해주세요.
  - 예를 들어서 th06/Characters.md, th06/Music_Titles.md, th06/Game_Titles.md 같은 식으로요.
  - 이 정보는 각 시리즈마다 다를 수 있습니다. 예를 들어서 th20의 경우에는 캐릭터 정보가 없을 수도 있습니다.
  - 만약 없다면 해당 파일은 만들지 않아도 괜찮습니다.