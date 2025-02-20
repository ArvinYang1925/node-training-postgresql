const { EntitySchema, JoinColumn } = require('typeorm')

module.exports = new EntitySchema({
    name: 'Coach',
    tableName: 'COACH',
    columns: {
        id: {
            primary: true,
            type: "uuid",
            generated: "uuid",
            nullable: false,
        },
        user_id: {
            type: "uuid",
            nullable: false,
            unique: true,
        },
        experience_years: {
            type: 'integer',
            nullable: false,
        },
        description: {
            type: 'text',
            nullable: false,
        },
        profile_image_url: {
            type: 'varchar',
            length: 2048,
            nullable: true,
        },
        created_at: {
            type: 'timestamp',
            nullable: false,
            createDate: true,
        },
        updated_at: {
            type: 'timestamp',
            nullable: false,
            updateDate: true,
        }
    },
    relations: {
        User: {
            target: 'User', // 目標實體名稱
            type: 'one-to-one', // 關係類型
            inverseSide: 'Coach', // 反向關係名稱 (在 User 實體中定義的關係屬性名稱)
            joinColumn: {
                name: 'user_id', // 外鍵欄位名稱
                referencedColumnName: 'id', // 參考的目標實體主鍵欄位名稱
                foreignKeyConstraintName: 'coach_user_id_fk' // 外鍵約束名稱
            }
        }
    }
})