import React, { useEffect } from "react";
import Auth from "../auth/Auth";

// css
import styles from "./Core.module.css";
// reduxにアクセスするため
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "../../app/store";

// マテリアルUI
import { withStyles } from "@material-ui/core/styles";
import {
  Button,
  Grid,
  Avatar,
  Badge,
  CircularProgress,
} from "@material-ui/core";

// カメラマーク
import { MdAddAPhoto } from "react-icons/md";

// authSliceから追加
import {
  editNickname,
  selectProfile,
  selectIsLoadingAuth,
  setOpenSignIn,
  resetOpenSignIn,
  setOpenSignUp,
  resetOpenSignUp,
  setOpenProfile,
  resetOpenProfile,
  fetchAsyncGetMyProf,
  fetchAsyncGetProfs,
} from "../auth/authSlice";

// postSliceから追加
import {
  selectPosts,
  selectIsLoadingPost,
  setOpenNewPost,
  resetOpenNewPost,
  fetchAsyncGetPosts,
  fetchAsyncGetComments,
} from "../post/postSlice";

// コンポーネント呼び出し
import Post from "../post/Post";
import EditProfile from "./EditProfile";
import NewPost from "./NewPost";

// ログインしているユーザーには緑色のランプがつくマテリアルUI
// そのままコピペ
const StyledBadge = withStyles((theme) => ({
  badge: {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "$ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}))(Badge);

const Core: React.FC = () => {
  // dispatchの実態定義
  const dispatch: AppDispatch = useDispatch();
  // reduxのストアから呼び出す
  const profile = useSelector(selectProfile);
  const posts = useSelector(selectPosts);
  const isLoadingPost = useSelector(selectIsLoadingPost);
  const isLoadingAuth = useSelector(selectIsLoadingAuth);

  // ブラウザが起動した時に実行される処理
  useEffect(() => {
    const fetchBootLoader = async () => {
      // JWTのトークンがある場合は
      if (localStorage.localJWT) {
        // SignInのモーダルを閉じる
        dispatch(resetOpenSignIn());
        // ログインユーザのプロファイルを取得する
        const result = await dispatch(fetchAsyncGetMyProf());
        // プロファイルの取得がうまくいかなかった時
        if (fetchAsyncGetMyProf.rejected.match(result)) {
          // SingInのモーダルを開く
          dispatch(setOpenSignIn());
          // nullを返す
          return null;
        }
        // ログインができている時
        // 投稿一覧を取得
        // プロファイル一覧を取得
        // コメント一覧取得
        await dispatch(fetchAsyncGetPosts());
        await dispatch(fetchAsyncGetProfs());
        await dispatch(fetchAsyncGetComments());
      }
    };
    // 定義した関数式を実行
    fetchBootLoader();
  }, [dispatch]);

  return (
    <div>
      <Auth />
      <EditProfile />
      <NewPost />
      <div className={styles.core_header}>
        <h1 className={styles.core_title}>SNS clone</h1>
        {/* ログインしている時 */}
        {profile?.nickName ? (
          <>
          {/* 新規投稿ボタン */}
            <button
              className={styles.core_btnModal}
              onClick={() => {
                dispatch(setOpenNewPost());
                dispatch(resetOpenProfile());
              }}
            >
              <MdAddAPhoto />
            </button>
            {/* ログアウトボタン */}
            <div className={styles.core_logout}>
              {(isLoadingPost || isLoadingAuth) && <CircularProgress />}
              <Button
                onClick={() => {
                  // ローカルストレージからJWTトークンを削除
                  localStorage.removeItem("localJWT");
                  // ニックネームを空欄にする（ログインの可否をニックネームがあるかどうかで確認しているため）
                  dispatch(editNickname(""));
                  // プロファイルを開かない
                  dispatch(resetOpenProfile());
                  // 新規投稿を閉じる
                  dispatch(resetOpenNewPost());
                  // サインインのモーダルを表示
                  dispatch(setOpenSignIn());
                }}
              >
                Logout
              </Button>
              {/* ログインしているアバターを取得 */}
              <button
                className={styles.core_btnModal}
                onClick={() => {
                  dispatch(setOpenProfile());
                  dispatch(resetOpenNewPost());
                }}
              >
                <StyledBadge
                  overlap="circular"
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  variant="dot"
                >
                  <Avatar alt="who?" src={profile.img} />{" "}
                </StyledBadge>
              </button>
            </div>
          </>
        ) : (
          // ログインしていないとき
          <div>
            <Button
              onClick={() => {
                dispatch(setOpenSignIn());
                dispatch(resetOpenSignUp());
              }}
            >
              LogIn
            </Button>
            <Button
              onClick={() => {
                dispatch(setOpenSignUp());
                dispatch(resetOpenSignIn());
              }}
            >
              SignUp
            </Button>
          </div>
        )}
      </div>

      {profile?.nickName && (
        <>
          <div className={styles.core_posts}>
            <Grid container spacing={4}>
              {posts
                .slice(0)
                .reverse()
                .map((post) => (
                  <Grid key={post.id} item xs={12} md={4}>
                    <Post
                      postId={post.id}
                      title={post.title}
                      loginId={profile.userProfile}
                      userPost={post.userPost}
                      imageUrl={post.img}
                      liked={post.liked}
                    />
                  </Grid>
                ))}
            </Grid>
          </div>
        </>
      )}
    </div>
  );
};

export default Core;