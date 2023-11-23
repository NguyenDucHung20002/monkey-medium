/* eslint-disable react/prop-types */
import axios from "axios";
import { useState } from "react";
import { config } from "../../utils/constants";

const ButtonFollowingTopic = ({ initialFollowing = false, slug = "" }) => {
  const [followed, setFollowed] = useState(initialFollowing);
  const token = localStorage.getItem("token");

  const handleFollow = async (slug) => {
    const res = await axios
      .post(
        `${config.SERVER_HOST}/follow-topic/${slug}/follow-unfollow`,
        {},
        {
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      .catch((err) => {
        console.log(err);
      });
    if (res.data.success) {
      setFollowed(!followed);
    }
  };
  if (!slug) return;
  return (
    <>
      {!followed ? (
        <button
          className="px-4 py-1 text-blue-600 border border-blue-600 cursor-pointer rounded-2xl"
          onClick={() => handleFollow(slug)}
        >
          Follow
        </button>
      ) : (
        <button
          className="px-4 py-1 text-white bg-blue-400 cursor-pointer rounded-2xl"
          onClick={() => handleFollow(slug)}
        >
          Following
        </button>
      )}
    </>
  );
};

export default ButtonFollowingTopic;
