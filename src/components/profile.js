import { qs, qsa } from "../dom.js?v=6";
import { getOutputDates, subscribe } from "../state.js?v=6";

const DETAILS = {
  "profile-name": {
    title: "프로필 이름",
    kicker: "Account",
    description: "현재 프로토타입은 브라우저 로컬 프로필을 사용합니다.",
    rows: [
      ["이름", "Local profile"],
      ["동기화", "없음"],
    ],
  },
  timezone: {
    title: "시간대",
    kicker: "Account",
    description: "날짜 계산과 자동 마감은 대한민국 표준시 기준으로 처리됩니다.",
    rows: [
      ["표준", "Asia/Seoul"],
      ["UTC offset", "+09:00"],
    ],
  },
  "image-size": {
    title: "이미지 크기",
    kicker: "Output",
    description: "완성된 그래픽은 1000 x 1000 PNG 출력을 기준으로 합니다.",
    rows: [
      ["캔버스", "1000 x 1000"],
      ["내부 그리드", "100 x 100"],
    ],
  },
  "seed-rule": {
    title: "시드 규칙",
    kicker: "Output",
    description: "날짜, 카테고리, 수치, 감정을 조합해 같은 입력은 같은 그래픽으로 재현합니다.",
    rows: [
      ["날짜", "dateKey"],
      ["기록", "category + value"],
    ],
  },
  "color-rule": {
    title: "색상 규칙",
    kicker: "Output",
    description: "감정은 대표색이 아니라 색채 범위를 만들고, 수치가 그 범위 안에서 변주를 만듭니다.",
    rows: [
      ["기본", "mood range"],
      ["강조", "#b3ea6c / #5de23d"],
    ],
  },
  "draft-storage": {
    title: "임시 기록 저장",
    kicker: "Data",
    description: "하루를 마치기 전의 기록은 임시 로그로 로컬 브라우저에 저장됩니다.",
    rows: [
      ["저장소", "localStorage"],
      ["마감 후", "로그 삭제"],
    ],
  },
  "archive-storage": {
    title: "그래픽 아카이브",
    kicker: "Data",
    description: "완료된 날짜는 원본 로그가 아니라 압축된 픽셀 그래픽 데이터로 보관됩니다.",
    rows: [
      ["형식", "compact grid"],
      ["다운로드", "PNG"],
    ],
  },
  "export-data": {
    title: "데이터 내보내기",
    kicker: "Data",
    description: "추후 JSON 또는 이미지 묶음 내보내기를 위한 자리입니다.",
    rows: [["상태", "준비 중"]],
  },
  location: {
    title: "위치",
    kicker: "Permissions",
    description: "현재 위치 권한은 사용하지 않습니다. 장소감은 수기 태그로 확장할 수 있습니다.",
    rows: [["상태", "사용 안 함"]],
  },
  notification: {
    title: "알림",
    kicker: "Permissions",
    description: "기록 리마인더를 붙일 때 사용할 수 있는 권한 자리입니다.",
    rows: [["상태", "사용 안 함"]],
  },
  health: {
    title: "건강 데이터",
    kicker: "Permissions",
    description: "웹 프로토타입에서는 Apple Health 또는 Health Connect에 직접 연결하지 않습니다.",
    rows: [["상태", "연결 없음"]],
  },
  version: {
    title: "프로토타입 버전",
    kicker: "App",
    description: "현재 UI와 생성 로직을 검증하기 위한 정적 웹 프로토타입입니다.",
    rows: [
      ["버전", "0.1.0"],
      ["상태", "prototype"],
    ],
  },
  deploy: {
    title: "배포 형태",
    kicker: "App",
    description: "정적 웹으로 배포할 수 있고, GitHub Pages 같은 환경에 올릴 수 있습니다.",
    rows: [
      ["형태", "static web"],
      ["서버", "불필요"],
    ],
  },
};

function renderDetail(detail) {
  return `
    <article class="detail-panel-card">
      <strong>${detail.title}</strong>
      <p>${detail.description}</p>
    </article>
    <div class="detail-value-list">
      ${detail.rows.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("")}
    </div>
  `;
}

export function initProfile() {
  const daysNode = qs("#profile-days");
  const entriesNode = qs("#profile-entries");
  const listPanel = qs("#profile-list-panel");
  const detailPanel = qs("#profile-detail-panel");
  const backButton = qs("#settings-back-button");
  const detailKicker = qs("#settings-detail-kicker");
  const detailTitle = qs("#settings-detail-title");
  const detailBody = qs("#settings-detail-body");

  qsa("[data-settings-panel]").forEach((button) => {
    button.addEventListener("click", () => {
      const detail = DETAILS[button.dataset.settingsPanel];
      if (!detail) return;
      detailKicker.textContent = detail.kicker;
      detailTitle.textContent = detail.title;
      detailBody.innerHTML = renderDetail(detail);
      listPanel.classList.add("hidden");
      detailPanel.classList.remove("hidden");
    });
  });

  backButton.addEventListener("click", () => {
    detailPanel.classList.add("hidden");
    listPanel.classList.remove("hidden");
  });

  subscribe(({ entries }) => {
    daysNode.textContent = String(getOutputDates().length);
    entriesNode.textContent = String(entries.length);
  });
}
