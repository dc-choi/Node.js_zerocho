const express = require('express'); // express 미들웨어
const path = require('path'); // 폴더와 파일의 경로를 쉽게 조작하도록 도와주는 Node.js 모듈
const morgan = require('morgan'); // 요청과 응답에 대한 정보를 콘솔에 기록하는 미들웨어
const bodyParser = require('body-parser'); // 요청의 본문에 있는 데이터를 해석해서 req.body로 만드는 미들웨어
const cookieParser = require('cookie-parser'); // 요청에 동봉된 쿠키를 해석해서 req.cookie로 만드는 미들웨어
const session = require('express-session'); // 세션 관리용 미들웨어, 사용자별로 req.session에 유지된다.
const dotenv = require('dotenv'); // .env 파일을 읽어서 process.env로 만드는 미들웨어 => 보안과 설정의 편의성때문에 사용함.
const multer = require('multer'); // multipart/form-data 형식의 데이터를 업로드 하는 미들웨어

dotenv.config(); // .env를 읽어온다.
const app = express();
app.set('port', process.env.PORT);

/*
	combined: 표준 Apache 통합 로그 출력입니다.
	common: 표준 Apache 공통 로그 출력입니다.
	dev: 개발용 응답 상태별로 색칠된 간결한 출력입니다.
	short: 기본값보다 짧으며, 응답 시간도 포함됩니다.
	tiny: 최소 출력입니다.
*/
app.use(morgan('dev'));

// static 미들웨어는 정적인 파일들을 제공하는 라우터 역할을 함. 기본적으로 제공됨.
app.use('/', express.static(path.join(__dirname, 'public')));
// path.join()은 안에 있는 모든 인자를 결합해서 결과를 나타낸다.

/*
	4.16버전부터  body-parser 미들웨어의 일부 기능이 express에 내장됨.
	버퍼 데이터나 텍스트 데이터를 읽어와야하는 경우에만 body-parser를 사용한다.
*/
app.use(express.json()); // JSON 형식의 req.body를 parse한다.
app.use(express.urlencoded({ extended: false }));
/*
	URL-encoded 방식(get)으로 보내는 데이터를 JSON 형식으로 parse한다.
	extended가 false면 Node.js의 querystring 모듈을 사용하고, true면 qs 모듈을 사용하여 쿼리 스트링을 해석한다.
	qs 모듈은 내장 모듈이 아니라 npm 패키지이며, querystring의 기능을 더 확장한 모듈이다.
*/
app.use(bodyParser.raw()); // 요청의 본문이 버퍼 데이터일때 해석함.
app.use(bodyParser.text()); // 요청의 본문이 텍스트 데이터일 때 해석함.

/*
	cookie-parser가 쿠키를 생성할 때 쓰이는 것은 아님.
	쿠키를 생성, 제거하기 위해서는 res.cookie(), res.clearCookie()를 사용해야함.
	res.cookie(키, 값, 옵션) 형식으로 사용한다.
	옵션은 domain, expires, httpOnly, maxAge, path, secure, signed 등이 있음.

	첫 번째 인수로 비밀키를 넣어줄 수 있는데 서명된 쿠키가 있는 경우,
	제공한 비밀 키를 통해 해당 쿠키가 내 서버가 만든 쿠키임을 검증할 수 있습니다.
	쿠키는 클라이언트에서 위조하기 쉬우므로 비밀키를 통해 만들어낸 서명을 쿠키 값 뒤에 붙입니다.
	서명이 붙으면 쿠키가 name=choi.sign과 같은 모양이 됩니다.
	서명된 쿠키는 res.cookies 대신에 res.signedCookies 객체에 들어 있습니다.

	옵션중에 signed라는 옵션이 있는데, 이를 true로 설정하면 쿠키 뒤에 서명이 붙습니다.
	내 서버가 쿠키를 만들었다는 것을 검증할 수 있으므로 대부분의 경우 서명 옵션을 켜두는 것이 좋습니다.
*/
app.use(cookieParser(process.env.SECRET)); // cookie-parser 미들웨어를 사용함. 비밀키로 서명을 하도록 미들웨어에 인수로 넣음.

/*
	인수로 세션에 대한 설정을 받습니다.
	resave: 요청이 올때 세션에 수정 사항이 생기지 않더라도 세션을 다시 저장할지 설정하는 것
	saveUninitialized: 세션에 저장할 내역이 없더라도 처음부터 세션을 생성할지 설정하는 것

	secret: express-session은 세션 관리시 클라이언트에 쿠키를 보낸다.
	안전하게 쿠키를 전송하려면 쿠키에 서명을 추가해야 하고, 쿠키를 서명하는데 secret의 값이 필요함.
	cookie-parser의 secret과 같게 설정하는 것이 좋다.

	name: 세션 쿠키의 이름 옵션 기름 이름은 connect.sid이다.
	cookie: 세션 쿠키에 대한 설정, 일반적인 쿠키 옵션이 모두 제공됨.

	req.session.name = 'choi'; // 세션 등록
	req.sessionID; // 세션 아이디 확인
	req.session.destroy(); // 세션 모두 제거
*/
app.use(session({
	resave: false,
	saveUninitialized: false,
	secret: process.env.SECRET,
	cookie: {
		httpOnly: true,
		secure: false,
	},
	name: 'sesion-cookie',
}));

app.use((req, res, next) => {
	console.log('run every request');
	next(); // 다음 미들웨어로 넘어가는 함수
});

app.get('/', (req, res, next) => {
	console.log('run Get / request');
	res.sendFile(path.join(__dirname, 'index.html'));
	// next();
}, (req, res) => {
	throw new Error('Error');
});

app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).send(err.message);
});

app.listen(app.get('port'), () => {
	console.log(app.get('port'), 'server wait...');
});