# README.ko.md (한국어)

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md)

# Citation Helper

Citation Helper는 지원되는 논문/챕터 페이지에서 인용 메타데이터를 추출하고, 여러 형식의 참고문헌 문자열을 생성해서 복사할 수 있게 해주는 Firefox 확장 프로그램입니다.

현재 버전
- v0.8.3

지원 사이트
- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- SpringerLink (link.springer.com)
  - /article/
  - /chapter/

지원 형식
- Vancouver
- APA 7판
- IEEE
- BibTeX
  - SpringerLink 챕터는 @incollection 형태로 내보내며 booktitle을 포함합니다.
- CSL-JSON (내보내기)
  - 매핑 메모: CSL-JSON_MAPPING.md
- RIS (내보내기)

사용 방법
- 지원되는 논문/챕터 페이지를 엽니다
- 확장 아이콘을 클릭합니다
- Fetch citation을 클릭합니다
- 스타일을 선택합니다
- Copy를 클릭해서 클립보드로 복사합니다

로컬 처리
- 현재 탭의 페이지에서 메타 태그, JSON-LD 등의 정보를 읽어 로컬에서 포맷팅합니다.

개발 환경
- formatter 스냅샷 테스트를 위해 Node.js가 필요합니다.
- 설치:
  - npm install

테스트 실행
- npm test

스냅샷 업데이트(출력이 의도적으로 바뀐 경우)
- npm run test:update

디버깅(마지막 CitationData 저장)
- 확장 DevTools 콘솔에서 디버그 모드를 켭니다:
  - about:debugging#/runtime/this-firefox
  - 확장 선택 후 Inspect 클릭
  - 실행:
    - browser.storage.local.set({ debugMode: true })
- 지원 페이지에서 Fetch citation 실행 후, 마지막 데이터를 확인합니다:
  - browser.storage.local.get(["lastCitationUrl","lastCitationAt","lastCitationData"]).then(console.log)

버전 정책
- v0.8.x: 기능 추가 및 export 개선, 스토어 베타와는 분리
- v0.9.0-beta: 스토어 베타 테스트 / 패키징 / QA 안정화
- v1.0.0: 첫 정식 릴리즈

라이선스
- TBD
