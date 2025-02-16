require("dotenv").config();
const http = require("http");
const errorHandle = require("./errorHandle.js")
const AppDataSource = require("./db");

function isUndefined(value) {
  return value === undefined;
}

function isNotValidSting(value) {
  return typeof value !== "string" || value.trim().length === 0 || value === "";
}

function isNotValidInteger(value) {
  return typeof value !== "number" || value < 0 || value % 1 !== 0;
}

function isNotValidUUID(value) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return !uuidRegex.test(value);
}

const requestListener = async (req, res) => {
  const headers = {
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Content-Length, X-Requested-With",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE",
    "Content-Type": "application/json",
  };

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  if (req.url === "/api/credit-package" && req.method === "GET") {
    try {
      const data = await AppDataSource.getRepository("CreditPackage").find({
        select: ["id", "name", "credit_amount", "price"],
      });
      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success",
          message: data,
        })
      );
      res.end();
    } catch (error) {
      errorHandle(res, headers)
    }
  } else if (req.url === "/api/credit-package" && req.method === "POST") {
    req.on("end", async () => {
      try {
        const { name, credit_amount, price } = JSON.parse(body);
        if (
          isUndefined(name) ||
          isNotValidSting(name) ||
          isUndefined(credit_amount) ||
          isNotValidInteger(credit_amount) ||
          isUndefined(price) ||
          isNotValidInteger(price)
        ) {
          res.writeHead(400, headers);
          res.write(
            JSON.stringify({
              status: "failed",
              message: "欄位未填寫正確",
            })
          );
          res.end();
          return;
        }
        const creditPackageRepo = await AppDataSource.getRepository("CreditPackage")
        const existPackage = await creditPackageRepo.find({
          where: {
            name: name,
          },
        })
        if (existPackage.length > 0) {
          res.writeHead(409, headers);
          res.write(
            JSON.stringify({
              status: "failed",
              message: "資料重複",
            })
          );
          res.end();
          return;
        }
        const newPackage = await creditPackageRepo.create({
          name,
          credit_amount,
          price,
        });
        const result = await creditPackageRepo.save(newPackage)
        res.writeHead(200, headers);
        res.write(
          JSON.stringify({
            status: "success",
            message: result,
          })
        );
        res.end();
      } catch (error) {
        errorHandle(res, headers)
      }
    });
  } else if (
    req.url.startsWith("/api/credit-package/") &&
    req.method === "DELETE"
  ) {
    try {
      const creditPackageId = req.url.split("/").pop();
      if (isUndefined(creditPackageId) || isNotValidSting(creditPackageId) || isNotValidUUID(creditPackageId)) {
        res.writeHead(400, headers)
        res.write(JSON.stringify({
          status: "failed",
          message: "ID錯誤"
        }))
        res.end()
        return
      }
      const result = await AppDataSource.getRepository("CreditPackage").delete(creditPackageId)
      if (result.affected === 0) {
        res.writeHead(400, headers)
        res.write(JSON.stringify({
          status: "failed",
          message: "ID錯誤"
        }))
        res.end()
        return
      }
      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success"
        })
      );
      res.end()
    } catch (error) {
      errorHandle(res, headers)
    }
  } else if (req.url === "/api/coaches/skill" && req.method === "GET") {
    try {
      const data = await AppDataSource.getRepository("Skill").find({
        select: ['id', 'name']
      })
      res.writeHead(200, headers);
      res.write( 
        JSON.stringify({
          status: "success",
          message: data,
        })
      );
      res.end();
    } catch (error) {
      errorHandle(res, headers)
    }
  } else if (req.url === "/api/coaches/skill" && req.method === "POST") {
    req.on('end', async () => {
      try {
        const {name} = JSON.parse(body)
        if (isUndefined(name) || isNotValidSting(name)) {
          res.writeHead(400, headers);
          res.write(
            JSON.stringify({
              status: "failed",
              message: "欄位未填寫正確",
            })
          );
          res.end();
          return;
        }
        const skillRepo = await AppDataSource.getRepository("Skill")
        const existSkill = await skillRepo.find({
          where: {
            name
          }
        })
        if (existSkill.length > 0) {
          res.writeHead(409, headers);
          res.write(
            JSON.stringify({
              status: "failed",
              message: "資料重複",
            })
          );
          res.end();
          return;
        }
        const newSkill = await skillRepo.create({
          name
        })
        const result = await skillRepo.save(newSkill)
        res.writeHead(200, headers);
        res.write(
          JSON.stringify({
            status: "success",
            message: result,
          })
        );
        res.end();
      } catch (error) {
        errorHandle(res, headers)
      }
    })
  } else if (req.url.startsWith("/api/coaches/skill/") && req.method === "DELETE") {
    try {
      const skillId = req.url.split("/").pop()
      if (isUndefined(skillId) || isNotValidSting(skillId) || isNotValidUUID(skillId)) {
        res.writeHead(400, headers)
        res.write(JSON.stringify({
          status: "failed",
          message: "ID錯誤"
        }))
        res.end()
        return
      }
      const result = await AppDataSource.getRepository("Skill").delete(skillId)
      if (result.affected === 0) {
        res.writeHead(400, headers)
        res.write(JSON.stringify({
          status: "failed",
          message: "ID錯誤"
        }))
        res.end()
        return
      }
      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success"
        })
      );
      res.end()
    } catch (error) {
      errorHandle(res, headers)
    }
  } else if (req.method === "OPTIONS") {
    res.writeHead(200, headers);
    res.end();
  } else {
    res.writeHead(404, headers);
    res.write(
      JSON.stringify({
        status: "failed",
        message: "無此網站路由",
      })
    );
    res.end();
  }
};

const server = http.createServer(requestListener);

async function startServer() {
  await AppDataSource.initialize();
  console.log("資料庫連接成功");
  server.listen(process.env.PORT);
  console.log(`伺服器啟動成功, port: ${process.env.PORT}`);
  return server;
}

module.exports = startServer();
