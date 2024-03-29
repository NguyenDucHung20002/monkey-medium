import { createContext, useState } from "react";
import HeaderDesignPage from "../modules/design/HeaderDesignPage";
import { Layout, Menu, Button, Modal } from "antd";
import { AppstoreOutlined, PictureOutlined } from "@ant-design/icons";
import { ArrowLeftIcon, ArrowRightIcon } from "../assets/icon";
import ContentDesignPage from "../modules/design/ContentDesignPage";
import { ImageItem, NavigationItem } from "../modules/design/ItemMenus";
import ImageUpload from "../components/image/ImageUpload";
import useUploadImage from "../hooks/useUploadImage";
import { apiGetProfile } from "../api/api";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
const { Header, Sider, Content } = Layout;

export const DesignContext = createContext();
const DesignProvider = (props) => {
  const [imageDisplay, setImageDisplay] = useState({
    display: "object-none",
    position: "object-top",
  });
  const [showFollRecmt, setShowFollRecmt] = useState({
    following: 1,
    recomment: 0,
  });
  const [user, setUser] = useState({});
  const { username } = useParams();
  const token = localStorage.getItem("token");
  // const designSettings = JSON.parse(localStorage.getItem("designSettings"));

  useEffect(() => {
    async function fetchUserInf() {
      const profileUser = await apiGetProfile(token, username);
      setUser({ ...profileUser });
    }
    // const curentSettings = () => {
    //   if (!designSettings) return;
    //   const dataShow = {
    //     following: designSettings?.show?.following,
    //     recomment: designSettings?.show?.recomment,
    //   };
    //   const styleImage = designSettings.style.split(" ");
    //   console.log("styleImage: ", styleImage);
    //   const dataImage = {
    //     display: styleImage[0],
    //     position: styleImage[2],
    //   };
    //   setImageDisplay(dataImage);
    //   setShowFollRecmt(dataShow);
    // };
    // curentSettings();
    fetchUserInf();
  }, [token, username]);
  const value = {
    imageDisplay,
    setImageDisplay,
    showFollRecmt,
    setShowFollRecmt,
    user,
  };
  return <DesignContext.Provider value={value} {...props} />;
};

const DesignPage = () => {
  const [selectedDevice, setSelectedDevice] = useState("desktop");
  const [collapsed, setCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { image, onSelectImage, onDeleteImage } = useUploadImage();
  const showModal = () => {
    onDeleteImage(image?.filename);
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const ButtonOk = () => (
    <div className="w-full text-center ">
      <button
        onClick={handleOk}
        className="rounded-full text-white bg-sky-600 hover:bg-sky-800 duration-300 py-1 px-6"
      >
        Ok
      </button>
    </div>
  );
  const getItem = (label, key = null, icon = "", children = null) => ({
    label,
    key,
    icon,
    children,
  });
  const items = [
    getItem(
      <h1 className="font-bold">Header</h1>,
      "sub1",
      <PictureOutlined />,
      [getItem(<ImageItem showModal={showModal} image={image} />, "1")]
    ),
    getItem(
      <h1 className="font-bold">Navigation</h1>,
      "sub2",
      <AppstoreOutlined />,
      [getItem(<NavigationItem />, "2")]
    ),
  ];

  return (
    <>
      <DesignProvider>
        <Layout>
          <Layout className="fixed left-0 right-0">
            <Header className="bg-white w-full h-auto p-0 z-10">
              <HeaderDesignPage
                selectedDevice={selectedDevice}
                setSelectedDevice={setSelectedDevice}
                image={image}
                onDeleteImage={onDeleteImage}
              />
            </Header>
          </Layout>
          <Layout className="fixed -z-10 top-[80px] bottom-0">
            <Sider
              className=""
              trigger={null}
              collapsible
              collapsed={collapsed}
            >
              <Menu
                selectable={false}
                // onClick={onClick}
                style={{
                  height: 1000,
                  padding: 0,
                }}
                mode="inline"
                items={items}
              >
                {/* <SubMenu title="haha" className="">
                <Image />
              </SubMenu> */}
              </Menu>
            </Sider>
            <Layout className="">
              <Content
                style={{
                  margin: 0,
                  padding: 0,
                  minHeight: 280,
                }}
              >
                <div className="absolute -translate-x-5 translate-y-5">
                  <Button
                    type="text"
                    icon={collapsed ? <ArrowRightIcon /> : <ArrowLeftIcon />}
                    onClick={() => setCollapsed(!collapsed)}
                    className="shadow-md"
                    style={{
                      fontselectedDevice: "16px",
                      width: 34,
                      height: 34,
                      background: "white",
                      borderRadius: "50%",
                    }}
                  />
                </div>
                <ContentDesignPage
                  collapsed={collapsed}
                  selectedDevice={selectedDevice}
                  image={image}
                />
              </Content>
            </Layout>
          </Layout>
        </Layout>
        <Modal
          // title="Basic Modal"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          footer={<ButtonOk />}
        >
          <div className="text-center">
            <h2 className="font-bold text-lg">Add background image</h2>
            <p className="">
              We recommend the background image be at least 1500 pixels wide. We
              support JPG, PNG files.
            </p>
          </div>
          <ImageUpload
            image={image?.url}
            onChange={(e) => onSelectImage(e)}
            handleDeleteImage={() => onDeleteImage(image?.filename)}
          />
        </Modal>
      </DesignProvider>
    </>
  );
};

export default DesignPage;
