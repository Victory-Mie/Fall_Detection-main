import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Typography,
  Descriptions,
} from "antd";
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import { fallApi } from "../services/api";
import { useAuthStore } from "../store/authStore";

const { Title, Text } = Typography;

interface ChatDialog {
  question: string;
  answer: string;
}

interface FallEvent {
  id: number;
  userId: number;
  timestamp: string;
  eventType: number; // 0: confirmed, 1: false_alarm, 2: emergency
  dialog: ChatDialog[];
  imageUrl?: string; // 新增
}

const getStatus = (eventType: number) => {
  if (eventType === 0) return { color: "green", text: "Confirmed" };
  if (eventType === 1) return { color: "orange", text: "False Alarm" };
  if (eventType === 2) return { color: "red", text: "Emergency" };
  return { color: "default", text: "Unknown" };
};

const History = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FallEvent[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FallEvent | null>(null);
  const user = useAuthStore((state) => state.user);

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await fallApi.getEvents(
        user?.id as number,
        page,
        pageSize
      );
      // 兼容后端返回结构 { records, total }
      const { records = [], total = 0 } = response.data?.data || {};
      console.log("response:", response.data.data);
      setData(records);
      setPagination({ current: page, pageSize, total });
      console.log("records:", records);
      console.log("total:", total);
      console.log("pagination:", { current: page, pageSize, total });
    } catch (error) {
      console.error("Failed to obtain the historical records.", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewDetail = (record: FallEvent) => {
    setSelectedEvent(record);
    setDetailModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "Confirm Deletion",
      icon: <ExclamationCircleOutlined />,
      content:
        "Are you sure you want to delete this record? This operation cannot be undone.",
      okText: "Confirm",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await fallApi.deleteEvent(id.toString());
          // 删除后判断是否需要跳到上一页
          // 如果当前页只剩一条且不是第一页，删除后自动跳到上一页，否则保持当前页
          const isLastItemOnPage = data.length === 1;
          const isNotFirstPage = pagination.current > 1;
          const nextPage =
            isLastItemOnPage && isNotFirstPage
              ? pagination.current - 1
              : pagination.current;
          fetchData(nextPage, pagination.pageSize);
        } catch (error) {
          console.error("Failed to delete the record:", error);
        }
      },
    });
  };

  const columns: TableProps<FallEvent>["columns"] = [
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      sorter: (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: "Status",
      dataIndex: "eventType",
      key: "eventType",
      render: (eventType: number) => {
        const { color, text } = getStatus(eventType);
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: "Confirmed", value: 0 },
        { text: "False Alarm", value: 1 },
        { text: "Emergency", value: 2 },
      ],
      onFilter: (value, record) => record.eventType === value,
    },
    {
      title: "Description",
      dataIndex: "dialog",
      key: "description",
      ellipsis: true,
      render: (dialog: ChatDialog[]) => {
        if (!dialog || dialog.length === 0) return "-";
        return dialog[0]?.question || "-";
      },
    },
    {
      title: "AI Response",
      dataIndex: "dialog",
      key: "aiResponse",
      ellipsis: true,
      render: (dialog: ChatDialog[]) => {
        if (!dialog || dialog.length === 0) return "-";
        return dialog[0]?.answer || "-";
      },
    },
    {
      title: "Actions",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleViewDetail(record)}>
            View Details
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            <DeleteOutlined /> Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ minHeight: "100vh" }}>
      <Title level={2}>Fall Event History Records</Title>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={(pag) => {
          fetchData(pag.current, pag.pageSize);
        }}
      />
      <Modal
        title="Fall Event Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {selectedEvent && (
          <>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Time">
                {selectedEvent.timestamp}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatus(selectedEvent.eventType).color}>
                  {getStatus(selectedEvent.eventType).text}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            {/* 新增：显示摔倒截图 */}
            {selectedEvent.imageUrl && (
              <div style={{ margin: "16px 0", textAlign: "center" }}>
                <img
                  src={`http://localhost:5000${selectedEvent.imageUrl}`}
                  alt="Fall Screenshot"
                  style={{
                    maxWidth: 400,
                    maxHeight: 300,
                    border: "2px solid #f5222d",
                    borderRadius: 8,
                  }}
                />
                <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                  Fall Screenshot
                </div>
              </div>
            )}
            {selectedEvent.dialog && selectedEvent.dialog.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Chat History:</Text>
                <div
                  style={{ marginTop: 8, maxHeight: 300, overflowY: "auto" }}
                >
                  {selectedEvent.dialog.map((dialog, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: 16,
                        padding: 12,
                        border: "1px solid #d9d9d9",
                        borderRadius: 6,
                      }}
                    >
                      <Text strong>Question {index + 1}:</Text>
                      <div style={{ marginTop: 4, marginBottom: 8 }}>
                        {dialog.question}
                      </div>
                      <Text strong>Answer {index + 1}:</Text>
                      <div style={{ marginTop: 4 }}>{dialog.answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default History;
