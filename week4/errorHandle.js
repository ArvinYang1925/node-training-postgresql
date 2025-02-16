function errorHandle(res, headers) {
  res.writeHead(500, headers);
  res.write(
    JSON.stringify({
      status: "error",
      message: "伺服器錯誤",
    })
  );
  res.end();
}

module.exports = errorHandle;
