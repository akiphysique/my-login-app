"use client";

// ログアウト確認ダイアログ
// ログアウトボタンを押したときに画面中央にオーバーレイ表示する確認画面

interface LogoutDialogProps {
  // onConfirm: 「はい」を押したときに実行する処理
  onConfirm: () => void;
  // onCancel: 「いいえ」を押したときに実行する処理（ダイアログを閉じる）
  onCancel: () => void;
}

export default function LogoutDialog({ onConfirm, onCancel }: LogoutDialogProps) {
  return (
    // オーバーレイ（画面全体を薄暗くする背景）
    <div className="logout-dialog-overlay" onClick={onCancel}>
      {/* ダイアログ本体（クリックが背景に伝わらないよう stopPropagation） */}
      <div className="logout-dialog-box" onClick={(e) => e.stopPropagation()}>
        <p className="logout-dialog-message">ログアウトします。よろしいですか？</p>
        <div className="logout-dialog-buttons">
          {/* 左：いいえ（グレー） */}
          <button onClick={onCancel} className="logout-dialog-btn-cancel">
            いいえ<br />
            <span className="logout-dialog-btn-sub">（ログアウトしない）</span>
          </button>
          {/* 右：はい（赤） */}
          <button onClick={onConfirm} className="logout-dialog-btn-confirm">
            はい<br />
            <span className="logout-dialog-btn-sub">（ログアウトする）</span>
          </button>
        </div>
      </div>
    </div>
  );
}
