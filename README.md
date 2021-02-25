데이터베이스 수업에서 한 6인 프로젝트.
html+css+Node.js+Mysql 이용하였음.

# 실행방법
1) Mysql에 sql_data.txt내용 복사/붙여넣기 하고 실행한다. 
2) DB최종압축파일.zip 다운로드 받고 압축 푼 다음 visual studio에서 열고 터미널에서 npm install, npm start
3) 인터넷에 localhost:8080주소로 들어가면 실행됨.

# 파일설명
- Report.pdf : 최종제출보고서. 기능 구현 내용, 설명, ERD 모두 있음.
- src/configs : DB연결
- src/controllers : 회원가입, 로그인
- src/routes/web : 페이지에서 다음 페이지 넘어가는 거 관리, DB query
- src/services : 회원정보수정, 로그인 관리, 회원가입 때 중복정보 관리
- src/validtion/authValidation : 비밀번호 최소 길이, 비밀번호 일치여부 확인
- src/views : 그 외 페이지, 기능 관리
- vendor : 폰트, 페이지 이미지


