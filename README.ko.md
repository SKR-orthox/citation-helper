# Citation Helper

언어: [English](README.md) | 한국어 | [日本語](README.ja.md)

**버전:** v0.9.0-beta

지원되는 논문/기사 페이지에서 메타데이터를 추출해 참고문헌을 만들고, 한 번에 복사/내보내기 할 수 있는 확장 프로그램입니다.

**개인정보/데이터 처리:** [PRIVACY.md](PRIVACY.md)

## 지원 브라우저

- **Firefox**: 서명된 XPI (AMO Unlisted / 자체 배포 베타)
- **Chrome**: Chrome Web Store (공개 등록, 현재 심사 중)

## 지원 사이트

- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- SpringerLink (link.springer.com)

## 출력 형식

- Vancouver
- APA 7th
- IEEE
- BibTeX
- CSL-JSON
- RIS

## 설치

### Firefox (서명된 XPI)

서명된 `.xpi` 파일이 있다면:

- `about:addons` 열기
- 톱니바퀴(⚙) 클릭
- **파일에서 부가 기능 설치...** 선택
- `.xpi` 파일 선택

### Chrome

Chrome Web Store 등록이 승인되면 스토어에서 설치할 수 있습니다.

로컬 테스트(개발자 모드):

- `chrome://extensions` 열기
- **개발자 모드** 켜기
- **압축해제된 확장 프로그램을 로드** 클릭
- `manifest.json`이 들어있는 폴더 선택

## 사용 방법

- 지원되는 논문/기사 페이지를 엽니다
- 툴바의 **Citation Helper** 아이콘을 클릭합니다
- **Style / Language / Authors**를 선택합니다
- **Fetch citation**을 누릅니다
- **Copy**를 누르거나, 원하는 내보내기 형식을 사용합니다

## 피드백 / 버그 제보

GitHub Issues로 부탁드립니다.

버그 제보 시 아래 정보를 포함해 주세요.

- URL
- 기대 결과 vs 실제 결과
- 사용한 형식(Style)과 Authors 프리셋
- (선택) 페이지의 인용/메타데이터 영역 스크린샷

## 개발

필수: Node.js (formatter 테스트/스크립트)

- 테스트: `npm test`
- 스냅샷 업데이트: `npm run test:update`

패키징:

- **Firefox**: `npx web-ext build` (AMO 서명용 ZIP 생성)
- **Chrome**: `manifest.json`이 ZIP 최상위에 오도록 압축(폴더 중첩 금지)

## 라이선스

리포지토리의 라이선스 파일(예: `LICENSE`)을 참고하세요.
