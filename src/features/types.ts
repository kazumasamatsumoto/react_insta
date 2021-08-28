// データ型の定義
// authSlice.ts

// ファイルオブジェクトのデータ型
export interface File extends Blob {
  readonly lastModifed: number;
  readonly name: string;
}

// 認証する際のデータ型
export interface PROPS_AUTHEN {
  email: string;
  password: string;
}

export interface PROPS_PROFILE {
  id: number;
  nickName: string;
  img: File | null;
}

export interface PROPS_NICKNAME {
  nickName: string;
}