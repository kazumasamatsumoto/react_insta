import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import axios from "axios";
// 投稿に関する型定義
import { PROPS_NEWPOST, PROPS_LIKED, PROPS_COMMENT } from "../types";

const apiUrlPost = `${process.env.REACT_APP_DEV_API_URL}api/post/`;
const apiUrlComment = `${process.env.REACT_APP_DEV_API_URL}api/comment/`;

// 非同期処理を同期的に実行するための実装
// 投稿一覧を取得する
export const fetchAsyncGetPosts = createAsyncThunk("post/get", async () => {
  const res = await axios.get(apiUrlPost, {
    headers: {
      Authorization: `JWT ${localStorage.localJWT}`,
    },
  });
  return res.data;
});

// 新しい投稿を実施する
export const fetchAsyncNewPost = createAsyncThunk(
  "post/post",
  // newPostをreact componentから受け取ることができるようにする
  async (newPost: PROPS_NEWPOST) => {
    // フォームデータを新規に作成する
    const uploadData = new FormData();
    // appendを使用してタイトルを追加する
    uploadData.append("title", newPost.title);
    // 画像をuploadDataにappendする
    newPost.img && uploadData.append("img", newPost.img, newPost.img.name);
    const res = await axios.post(apiUrlPost, uploadData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${localStorage.localJWT}`,
      },
    });
    return res.data;
  }
);

// いいねを実施する
export const fetchAsyncPatchLiked = createAsyncThunk(
  "post/patch",
  async (liked: PROPS_LIKED) => {
    // 現在のいいねしているユーザーリストを格納
    const currentLiked = liked.current;
    // アップロードするデータの箱
    const uploadData = new FormData();

    // いいねボタンが押されている場合は解除
    let isOverlapped = false;
    // 現在のいいねのIDの配列を一つずつ確認していく
    currentLiked.forEach((current) => {
      if (current === liked.new) {
        isOverlapped = true;
      } else {
        // 新しく押した場合はlikedのデータを追加する
        uploadData.append("liked", String(current));
      }
    });

    // 新しくいいねを実行した場合
    if (!isOverlapped) {
      uploadData.append("liked", String(liked.new));
    } else if (currentLiked.length === 1) {
      // すでにいいねを実行しているときで現在のいいねのIDが1つの時
      // currentをからにするのではなくそもそもの投稿のを初期化する
      // するといいねがない状態で格納されるといった形になります。
      uploadData.append("title", liked.title);
      // なのでputで新規登録を実施します。
      const res = await axios.put(`${apiUrlPost}${liked.id}/`, uploadData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${localStorage.localJWT}`,
        },
      });
      return res.data;
    }
    // 現在複数ある状態ではpatchで更新します。
    const res = await axios.patch(`${apiUrlPost}${liked.id}/`, uploadData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${localStorage.localJWT}`,
      },
    });
    return res.data;
  }
);

// コメント一覧を取得する
export const fetchAsyncGetComments = createAsyncThunk(
  "comment/get",
  async () => {
    const res = await axios.get(apiUrlComment, {
      headers: {
        Authorization: `JWT ${localStorage.localJWT}`,
      },
    });
    return res.data;
  }
);

// コメントを投稿する
export const fetchAsyncPostComment = createAsyncThunk(
  "comment/post",
  async (comment: PROPS_COMMENT) => {
    const res = await axios.post(apiUrlComment, comment, {
      headers: {
        Authorization: `JWT ${localStorage.localJWT}`,
      },
    });
    return res.data;
  }
);

// sliceの中のstateを定義
export const postSlice = createSlice({
  // sliceの名前の定義
  name: "post",
  // 初期値
  initialState: {
    isLoadingPost: false,
    openNewPost: false,
    posts: [
      {
        id: 0,
        title: "",
        userPost: 0,
        created_on: "",
        img: "",
        liked: [0],
      },
    ],
    comments: [
      {
        id: 0,
        text: "",
        userComment: 0,
        post: 0,
      },
    ],
  },
  // dispatchで実行する関数
  reducers: {
    // 投稿中のステータス
    fetchPostStart(state) {
      state.isLoadingPost = true;
    },
    // 投稿完了のステータス
    fetchPostEnd(state) {
      state.isLoadingPost = false;
    },
    // 新しく投稿するステータス
    setOpenNewPost(state) {
      state.openNewPost = true;
    },
    // 投稿完了のステータス
    resetOpenNewPost(state) {
      state.openNewPost = false;
    },
  },
  // dispatchの実行状態による実行内容、完了後、失敗した時、実行中
  extraReducers: (builder) => {
    builder.addCase(fetchAsyncGetPosts.fulfilled, (state, action) => {
      return {
        ...state,
        posts: action.payload,
      };
    });
    builder.addCase(fetchAsyncNewPost.fulfilled, (state, action) => {
      return {
        ...state,
        // 現在のステートを配列で管理して、投稿した内容を配列の最後に追加する
        posts: [...state.posts, action.payload],
      };
    });
    builder.addCase(fetchAsyncGetComments.fulfilled, (state, action) => {
      return {
        ...state,
        // コメントを取得した内容をstoreのコメントに格納する
        comments: action.payload,
      };
    });
    builder.addCase(fetchAsyncPostComment.fulfilled, (state, action) => {
      return {
        ...state,
        // 現在のステートを配列で管理して、投稿した内容を配列の最後に追加する
        comments: [...state.comments, action.payload],
      };
    });
    builder.addCase(fetchAsyncPatchLiked.fulfilled, (state, action) => {
      return {
        ...state,
        // 既存の投稿一覧の配列をmapで確認して更新した内容のみを置き換える
        posts: state.posts.map((post) =>
          post.id === action.payload.id ? action.payload : post
        ),
      };
    });
  },
});

// dispatchで使えるようにエクスポート
export const {
  fetchPostStart,
  fetchPostEnd,
  setOpenNewPost,
  resetOpenNewPost,
} = postSlice.actions;

// useSelectorを使用して外部からアクセスできるようにする
export const selectIsLoadingPost = (state: RootState) =>
  state.post.isLoadingPost;
export const selectOpenNewPost = (state: RootState) => state.post.openNewPost;
export const selectPosts = (state: RootState) => state.post.posts;
export const selectComments = (state: RootState) => state.post.comments;

export default postSlice.reducer;