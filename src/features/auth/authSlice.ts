import {  createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import axios from 'axios'
import { PROPS_AUTHEN, PROPS_PROFILE, PROPS_NICKNAME } from "../types"

const apiUrl = process.env.REACT_APP_DEV_API_URL;

// 非同期の関数はSliceの外で実装します

// ReduxToolKitのcreateAsyncThunkを使用する
// 非同期関数は成功したとき、失敗したとき、実行中の3つの状態で確認することができる
// それぞれの状態で後処理を記載することができてその後処理はextraReducerとする
export const fetchAsyncLogin = createAsyncThunk(
  // actionの名前（好きな名前でOK）
  "auth/post",
  // asyncを使用することで非同期処理を同期処理に変更する
  // authenは引数、型はPROPS_AUTHEN
  // componentからemailとpasswordに入力して実行
  async (authen: PROPS_AUTHEN) => {
    // 第一引数はaxiosでアクセスするURL
    // 第二引数は渡すデータ
    // 第三引数はheaders
    // postやputの場合はContent-Typeが必要
    // getの場合は不要
    const res = await axios.post(`${apiUrl}authen/jwt/create`, authen, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    // JWTトークンを返り値とする
    return res.data
  }
)

// 新規ユーザーを作成する関数
// createAsyncThunkの第一引数は名前、第二引数は非同期を同期処理してその返り値
export const fetchAsyncRegister = createAsyncThunk(
  "auth/register",
  async (auth: PROPS_AUTHEN) => {
    const res = await axios.post(`${apiUrl}api/register/`, auth, {
      headers: {
        "Content-Type": "application/json",
      }
    });
    return res.data;
  }
);

// プロファイルの作成に関する非同期処理
// プロファイルの編集にはログインが必須となるためheadersの中にAuthorizationが必要
// componentから使用してnickNameを引数として受け取る
// createAsyncThunkの第二引数として返り値が必要で、その返り値をdispatchで更新するstateとなる
export const fetchAsyncCreateProf = createAsyncThunk(
  "profile/post",
  async (nickName: PROPS_NICKNAME) => {
    const res = await axios.post(`${apiUrl}api/profile/`, nickName, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${localStorage.localJWT}`,
      },
    });
    return res.data;
  }
)

// プロフィールを更新する関数
// 
export const fetchAsyncUpdateProf = createAsyncThunk(
  "profile/put",
  async (profile: PROPS_PROFILE) => {
    // 新しくフォームデータを作成する
    const uploadData = new FormData();
    // フォームデータはappendで色々と追加することが可能になるためその都度追加していく
    // ニックネームの追加
    uploadData.append("nickName", profile.nickName);
    // プロフィールのイメージ画像がある時だけ画像と、画像の名前を追加する
    profile.img && uploadData.append("img", profile.img, profile.img.name);
    const res = await axios.put(
      // プロフィールの更新はidを指定する必要があるため引数の中のidを入れる
      `${apiUrl}api/profile/${profile.id}/`,
      uploadData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${localStorage.localJWT}`,
        },
      }
    );
    return res.data;
  }
);

// 現在ログインしているユーザーの取得
export const fetchAsyncGetMyProf = createAsyncThunk("profile/get", async () => {
  const res = await axios.get(`${apiUrl}api/myprofile/`, {
    headers: {
      Authorization: `JWT ${localStorage.localJWT}`,
    },
  });
  // djangoで配列で返しているため0番目に設定する必要がある
  return res.data[0]
});

// 存在するプロフィール一覧を取得する
export const fetchAsyncGetProfs = createAsyncThunk('profiles/get', async () => {
  const res = await axios.get(`${apiUrl}api/profile`, {
    headers: {
      Authorization: `JWT ${localStorage.localJWT}`,
    },
  });
  return res.data;
});


export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    openSignIn: true,
    openSignUp: false,
    openProfile: false,
    isLoadingAuth: false,
    myprofile: {
      id: 0,
      nickName: "",
      userProfile: 0,
      created_on: "",
      img: "",
    },
    profiles: [
      {
        id: 0,
        nickName: "",
        userProfile: 0,
        created_on: "",
        img: "",
      }
    ]
  },
  reducers: {
    // dispatch経由で呼び出すことによって自由自在に値を変更することができる
    fetchCredStart(state) {
      state.isLoadingAuth = true;
    },
    fetchCredEnd(state) {
      state.isLoadingAuth = false;
    },
    setOpenSignIn(state) {
      state.openSignIn = true;
    },
    resetOpenSignIn(state) {
      state.openSignIn = false;
    },
    setOpenSignUp(state) {
      state.openSignUp = true;
    },
    resetOpenSignUp(state) {
      state.openSignUp = false;
    },
    setOpenProfile(state) {
      state.openProfile = true;
    },
    resetOpenProfile(state) {
      state.openProfile = false;
    },
    editNickname(state, action) {
      state.myprofile.nickName = action.payload;
    },
  },
  // 後処理（非同期関数の実施の処理中、成功後、失敗後など色々設定ができます。
  // 今回はfulfilled成功時のみ
  extraReducers: (builder) => {
    builder.addCase(fetchAsyncLogin.fulfilled, (state, action) => {
      localStorage.setItem("localJWT", action.payload.access);
    });
    builder.addCase(fetchAsyncCreateProf.fulfilled, (state, action) => {
      state.myprofile = action.payload;
    });
    builder.addCase(fetchAsyncGetMyProf.fulfilled, (state, action) => {
      state.myprofile = action.payload;
    });
    builder.addCase(fetchAsyncGetProfs.fulfilled, (state, action) => {
      state.profiles = action.payload;
    });
    builder.addCase(fetchAsyncUpdateProf.fulfilled, (state, action) => {
      state.myprofile = action.payload;
      state.profiles = state.profiles.map((prof) =>
        prof.id === action.payload.id ? action.payload : prof
      );
    });
  },
});

// reactのコンポーネントで使用できるようにexportを実施
export const {
  fetchCredStart,
  fetchCredEnd,
  setOpenSignIn,
  resetOpenSignIn,
  setOpenSignUp,
  resetOpenSignUp,
  setOpenProfile,
  resetOpenProfile,
  editNickname,
} = authSlice.actions;

// Redux ToolkitのuseSelectorを使用してstoreの中のsliceの中のstateを取得する
// これでcomponentからstateにアクセスすることができます。
export const selectIsLoadingAuth = (state: RootState) =>
  state.auth.isLoadingAuth;
export const selectOpenSignIn = (state: RootState) => state.auth.openSignIn;
export const selectOpenSignUp = (state: RootState) => state.auth.openSignUp;
export const selectOpenProfile = (state: RootState) => state.auth.openProfile;
export const selectProfile = (state: RootState) => state.auth.myprofile;
export const selectProfiles = (state: RootState) => state.auth.profiles;

export default authSlice.reducer;
