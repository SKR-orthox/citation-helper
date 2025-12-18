# README.ko.md (한국어)

Citation Helper는 지원되는 논문/챕터 페이지에서 메타데이터를 추출하고, 참고문헌 형식으로 변환해 복사할 수 있는 Firefox 확장 프로그램입니다.

지원 사이트
- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- SpringerLink (link.springer.com)
  - /article/ 및 /chapter/ 지원

지원 형식
- Vancouver
- APA 7판
- IEEE
- BibTeX
  - SpringerLink의 chapter는 @incollection + booktitle로 출력됩니다.

사용 방법
- 지원되는 논문 페이지를 엽니다
- 확장 프로그램 아이콘을 클릭합니다
- Fetch citation 버튼을 누릅니다
- 형식을 선택한 뒤 Copy로 복사합니다

로컬 처리
- 현재 페이지의 메타 태그 등을 기반으로 추출하며, 변환은 로컬에서 수행됩니다.

개발/테스트
- Node.js가 필요합니다.
- 의존성 설치:
  - npm install

테스트 실행
- npm test

스냅샷 갱신(의도적으로 출력이 바뀐 경우)
- node ./run-formatters.cjs --update
  - 편하게 쓰려면 package.json scripts에 다음을 추가하는 것을 추천합니다
    - "test:update": "node ./run-formatters.cjs --update"

디버깅 lastCitationData 저장
- 확장 DevTools 콘솔에서 debugMode를 켭니다
  - about:debugging#/runtime/this-firefox
  - 확장 프로그램에서 Inspect 클릭
  - 실행:
    - browser.storage.local.set({ debugMode: true })
- 지원 페이지에서 Fetch citation을 한 번 실행한 후 아래로 확인합니다
  - browser.storage.local.get(["lastCitationUrl","lastCitationAt","lastCitationData"]).then(console.log)

버전 운영 방침
- v0.8.x: 기능 추가 및 export 확장(스토어 베타와 분리)
- v0.9.0-beta: 스토어 베타 테스트, 패키징, 스토어 QA 안정화
- v1.0.0: 첫 정식 릴리즈

라이선스
- 추후 결정