import axios from "axios";
import { config } from "../utils/constants";
import { toast } from "react-toastify";

const apiFollowTopic = async (slug, token) => {
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
      if (err.response.status == 404) {
        toast.error("Can not find topic!", {
          pauseOnHover: false,
          delay: 500,
        });
      }
    });
  if (res.data.success) {
    return true;
  }

  return false;
};

export default apiFollowTopic;
