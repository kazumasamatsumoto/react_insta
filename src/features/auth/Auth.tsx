import React from "react";
// dispatchの型をインポート
import { AppDispatch } from "../../app/store";
// reduxにアクセスするためにインポート
// useSelectorは値、useDispatchは更新
import { useSelector, useDispatch } from "react-redux";
// css
import styles from "./Auth.module.css";
// モーダル
import Modal from "react-modal";
// バリデーション
import { Formik } from "formik";
import * as Yup from "yup";
// マテリアルUI
import { TextField, Button, CircularProgress } from "@material-ui/core";

// authSliceのアクション、非同期関数、useSelectorの関数群
import {
  selectIsLoadingAuth,
  selectOpenSignIn,
  selectOpenSignUp,
  setOpenSignIn,
  resetOpenSignIn,
  setOpenSignUp,
  resetOpenSignUp,
  fetchCredStart,
  fetchCredEnd,
  fetchAsyncLogin,
  fetchAsyncRegister,
  fetchAsyncGetMyProf,
  fetchAsyncGetProfs,
  fetchAsyncCreateProf,
} from "./authSlice";

// モーダルのスタイルを定義
const customStyles = {
  // モーダル表示の時のバックグラウンド
  overlay: {
    backgroundColor: "#777777",
  },
  // モーダルの大きさと中央に表示させる
  content: {
    top: "55%",
    left: "50%",

    width: 280,
    height: 350,
    padding: "50px",

    transform: "translate(-50%, -50%)",
  },
};

// Reactのfunctional component typescriptの場合はReact.FCを追加
const Auth: React.FC = () => {
  // reactのモーダルを宣言index.tsxでの対応させているエレメントのタグがrootなので今回はroot
  Modal.setAppElement("#root");
  // モーダルのサインインを表示非表示のステータスをsliceのstateから取得
  const openSignIn = useSelector(selectOpenSignIn);
  // サインアップも同様
  const openSignUp = useSelector(selectOpenSignUp);
  const isLoadingAuth = useSelector(selectIsLoadingAuth);
  // dispatchの実態を作成しておく
  const dispatch: AppDispatch = useDispatch();

  return (
    // フラグメントに変更しておく
    <>
    {/* 新規ユーザー作成用のモーダルを作成する */}
      <Modal
      // isOpen=true or false
      // 表示非表示redux tool kitで管理してます。
        isOpen={openSignUp}
        // モーダル以外の場所をクリックしたときに呼ばれる関数を定義できる
        // dispatch経由でresetOpenSignUpを呼び出す
        // モーダルが非表示になります。
        onRequestClose={async () => {
          await dispatch(resetOpenSignUp());
        }}
        // モーダルのスタイルを定義
        style={customStyles}
      >
        {/* フォームのバリデーションを実施するためにFormikとYupを使用 */}
        <Formik
        // 最初の初期状態のエラーのステートを定義
          initialErrors={{ email: "required" }}
          // 入力フォームで制御するパラメータを定義、今回はemailとpasswordをバリデーションを実施する
          initialValues={{ email: "", password: "" }}
          // submitを実施したときに処理される内容を記載
          // valuesには入力した値をvaluesにオブジェクト型で渡す
          onSubmit={async (values) => {
            // authSliceで作成したisLoadingAuthを管理する内容です。
            // あくまでもdispatchはstateの中身を再評価するために使用します。
            await dispatch(fetchCredStart());
            // 入力内容をfetchAsyncRegisterに渡して実行します。その返り値をresultRegに格納します。
            const resultReg = await dispatch(fetchAsyncRegister(values));
            // fetchAsyncRegisterが正常終了した時に実行する
            if (fetchAsyncRegister.fulfilled.match(resultReg)) {
              // ログインを実施します（入力値をそのまま使用します）
              await dispatch(fetchAsyncLogin(values));
              // プロファイルを作成します。（ニックネームはanonymousに設定します）
              // ログインを実施しているとローカルストレージにJWTトークンが格納されているため使用が可能になります。
              await dispatch(fetchAsyncCreateProf({ nickName: "anonymous" }));
              // プロフィール一覧を取得します。
              await dispatch(fetchAsyncGetProfs());
              // 自分のプロフィールを取得します
              await dispatch(fetchAsyncGetMyProf());
            }
            // 処理が終わった時にisLoadingAuthをFalseにします。
            await dispatch(fetchCredEnd());
            // モーダルを閉じる処理です。
            await dispatch(resetOpenSignUp());
          }}
          // バリデーションの内容を定義することができます。
          validationSchema={Yup.object().shape({
            // バリデーションしたいパラメータを記載
            // .emailと記載するだけでemailのバリデーションを実施してくれます。
            email: Yup.string()
              .email("email format is wrong")
              // 何かしらの入力が必須にしています。
              .required("email is must"),
              // パスワードは必須にして最小文字を4文字に設定しています。
            password: Yup.string().required("password is must").min(4),
          })}
        >
          {/* Formikの中にFormを作成する */}
          {/* アロー関数の形式でFormikで事前に準備されている引数 */}
          {({
            // 関数のハンドラー
            handleSubmit,
            handleChange,
            handleBlur,
            // ユーザーが入力している値を取得している
            values,
            // バリデーションの結果としてエラーがある場合はここから取得
            errors,
            // 入力フォームにフォーカスされた時にtrueになる
            touched,
            // バリデーションに問題がないときにTrueになります。
            isValid,
          }) => (
            <div>
              {/* フォームで囲う */}
              <form onSubmit={handleSubmit}>
                {/* css */}
                <div className={styles.auth_signUp}>
                  {/* css */}
                  <h1 className={styles.auth_title}>SNS clone</h1>
                  <br />
                  {/* css */}
                  {/* isLoadingAuthがtrueの時に待機中のようなものを表示 */}
                  {/* 通信中に円形のものがぐるぐる回るマテリアルUIから使用 */}
                  <div className={styles.auth_progress}>
                    {isLoadingAuth && <CircularProgress />}
                  </div>
                  <br />

                  {/* emailの入力フォーム */}
                  {/* マテリアルUIのTextFieldを使用 */}
                  <TextField
                  // デフォルトで表示される文字
                    placeholder="email"
                    type="input"
                    name="email"
                    // ユーザーが入力フォームで変更する際にフォーミックのバリデーションを実施してくれる
                    onChange={handleChange}
                    // 入力フォームからフォーカスを外した時にバリデーションの検証を実施してくれる
                    onBlur={handleBlur}
                    // valuesに現在の値が入っているので格納します。
                    value={values.email}
                  />
                  <br />
                  {/* エラーに関してバリデーションがエラーの時にエラーメッセージを表示させる */}
                  {/* touchedは一度でもフォーカスが当たっているかどうか */}
                  {/* emailに対してフォーカスが当たっていて尚且つバリデーションがエラーの時 */}
                  {/* エラーがないときはnullにしている */}
                  {touched.email && errors.email ? (
                    <div className={styles.auth_error}>{errors.email}</div>
                  ) : null}

                  {/* パスワードも同様 */}
                  <TextField
                    placeholder="password"
                    type="password"
                    name="password"
                    // ユーザーが入力フォームで変更する際にフォーミックのバリデーションを実施してくれる
                    onChange={handleChange}
                    // 入力フォームからフォーカスを外した時にバリデーションの検証を実施してくれる
                    onBlur={handleBlur}
                    value={values.password}
                  />
                  {touched.password && errors.password ? (
                    <div className={styles.auth_error}>{errors.password}</div>
                  ) : null}
                  <br />
                  <br />

                  {/* submitのボタン */}
                  <Button
                    variant="contained"
                    color="primary"
                    // バリデーションの結果がfalseの時は非活性になります。
                    disabled={!isValid}
                    type="submit"
                  >
                    Register
                  </Button>
                  <br />
                  <br />
                  {/* ログインモードとアカウント作成モードを切り替えることができるようにする */}
                  <span
                    className={styles.auth_text}
                    onClick={async () => {
                      await dispatch(setOpenSignIn());
                      await dispatch(resetOpenSignUp());
                    }}
                  >
                    You already have a account ?
                  </span>
                </div>
              </form>
            </div>
          )}
        </Formik>
      </Modal>

      <Modal
      // モーダルを開く条件
        isOpen={openSignIn}
        // モーダル以外の箇所をクリックした時
        onRequestClose={async () => {
          await dispatch(resetOpenSignIn());
        }}
        // スタイルの適用
        style={customStyles}
      >
        <Formik
          // 開いた時にエラーを実施する
          initialErrors={{ email: "required" }}
          // フォーム初期値
          initialValues={{ email: "", password: "" }}
          // submitが実施された時
          onSubmit={async (values) => {
            // ローディング
            await dispatch(fetchCredStart());
            // ログインが成功したときの結果の返り値を格納する
            const result = await dispatch(fetchAsyncLogin(values));
            // 成功した時にプロフィール一覧とログインユーザーのプロファイルを取得する
            if (fetchAsyncLogin.fulfilled.match(result)) {
              await dispatch(fetchAsyncGetProfs());
              await dispatch(fetchAsyncGetMyProf());
            }
            // ローディングを閉じる
            await dispatch(fetchCredEnd());
            // サインインのモーダルを閉じる
            await dispatch(resetOpenSignIn());
          }}
          // バリデーションチェック
          validationSchema={Yup.object().shape({
            email: Yup.string()
              .email("email format is wrong")
              .required("email is must"),
            password: Yup.string().required("password is must").min(4),
          })}
        >
                    {/* Formikの中にFormを作成する */}
          {/* アロー関数の形式でFormikで事前に準備されている引数 */}
          {({
            handleSubmit,
            handleChange,
            handleBlur,
            values,
            errors,
            touched,
            isValid,
          }) => (
            <div>
              <form onSubmit={handleSubmit}>
                <div className={styles.auth_signUp}>
                  <h1 className={styles.auth_title}>SNS clone</h1>
                  <br />
                  <div className={styles.auth_progress}>
                    {isLoadingAuth && <CircularProgress />}
                  </div>
                  <br />

                  <TextField
                    placeholder="email"
                    type="input"
                    name="email"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.email}
                  />

                  {touched.email && errors.email ? (
                    <div className={styles.auth_error}>{errors.email}</div>
                  ) : null}
                  <br />

                  <TextField
                    placeholder="password"
                    type="password"
                    name="password"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.password}
                  />
                  {touched.password && errors.password ? (
                    <div className={styles.auth_error}>{errors.password}</div>
                  ) : null}
                  <br />
                  <br />
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!isValid}
                    type="submit"
                  >
                    Login
                  </Button>
                  <br />
                  <br />
                  <span
                    className={styles.auth_text}
                    onClick={async () => {
                      await dispatch(resetOpenSignIn());
                      await dispatch(setOpenSignUp());
                    }}
                  >
                    You don't have a account ?
                  </span>
                </div>
              </form>
            </div>
          )}
        </Formik>
      </Modal>
    </>
  );
};

export default Auth;
