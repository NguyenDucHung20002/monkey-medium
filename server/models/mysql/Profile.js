import { DataTypes } from "sequelize";
import sequelize from "../../databases/mysql/connect.js";
import User from "./User.js";

const Profile = sequelize.define(
  "Profile",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    avatar: { type: DataTypes.STRING, allowNull: false },

    fullname: { type: DataTypes.STRING, allowNull: false },

    bio: { type: DataTypes.STRING, allowNull: true },

    about: { type: DataTypes.TEXT, allowNull: true },

    followingCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    followersCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    unReadNotificationsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
  },

  {
    tableName: "profiles",
    timestamps: true,
  }
);

export default Profile;