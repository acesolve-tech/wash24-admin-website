import { db } from "@/config/firebase";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

interface ListItem {
  id: string;
  name: string;
  phone: string;
  note: string;
  status: string;
  type: string;
  position: number;
  finish_time: string;
  driver: string;
}

interface UpdateDeliveryProps {
  regionCollectionName?: string;
  setOpenEditForm: Dispatch<SetStateAction<{ status: boolean; details: any }>>;
  setLoading: (value: boolean) => void;
  currRole: string;
}

const DragNDropList: React.FC<UpdateDeliveryProps> = (props) => {
  const [listPickUp, setListPickUp] = useState<ListItem[]>([]);
  const [listDelivery, setListDelivery] = useState<ListItem[]>([]);
  const [listFinishPickUp, setListFinishPickUp] = useState<ListItem[]>([]);
  const [listFinishDelivery, setListFinishDelivery] = useState<ListItem[]>([]);
  const [listCancelPickUp, setListCancelPickUp] = useState<ListItem[]>([]);
  const [listCancelDelivery, setListCancelDelivery] = useState<ListItem[]>([]);

  useEffect(() => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

    const fetchDataPickUp = async () => {
      try {
        const q = query(
          collection(db, `delivery-${props.regionCollectionName}`),
          where("type", "==", "Pick Up"),
          where("status", "==", "On Progress")
        );

        onSnapshot(q, (snapshot) => {
          const items: ListItem[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            items.push({
              id: doc.id,
              name: data.name,
              phone: data.phone,
              note: data.note,
              status: data.status,
              type: data.type,
              position: data.position,
              finish_time: data.finish_time,
              driver: data.driver,
            });
          });

          const orderedPickUpList = items
            .slice()
            .sort((a, b) => a.position - b.position);
          setListPickUp(orderedPickUpList);
        });
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    const fetchDataDeliver = async () => {
      try {
        const q = query(
          collection(db, `delivery-${props.regionCollectionName}`),
          where("type", "==", "Deliver"),
          where("status", "==", "On Progress")
        );

        onSnapshot(q, (snapshot) => {
          const items: ListItem[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            items.push({
              id: doc.id,
              name: data.name,
              phone: data.phone,
              note: data.note,
              status: data.status,
              type: data.type,
              position: data.position,
              finish_time: data.finish_time,
              driver: data.driver,
            });
          });

          const orderedDeliveryList = items
            .slice()
            .sort((a, b) => a.position - b.position);
          setListDelivery(orderedDeliveryList);
        });
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    const fetchDataFinishPickUp = async () => {
      try {
        const q = query(
          collection(db, `delivery-${props.regionCollectionName}`),
          where("type", "==", "Pick Up"),
          where("status", "==", "Finish"),
          where("finish_date", "==", formattedDate)
        );

        onSnapshot(q, (snapshot) => {
          const items: ListItem[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            items.push({
              id: doc.id,
              name: data.name,
              phone: data.phone,
              note: data.note,
              status: data.status,
              type: data.type,
              position: data.position,
              finish_time: data.finish_time,
              driver: data.driver,
            });
          });
          const orderedFinishPickUpList = items.slice().sort((a, b) => {
            const timeA = a.finish_time.toUpperCase();
            const timeB = b.finish_time.toUpperCase();

            if (timeA < timeB) {
              return -1;
            }
            if (timeA > timeB) {
              return 1;
            }
            return 0;
          });
          setListFinishPickUp(orderedFinishPickUpList);
        });
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    const fetchDataFinishDeliver = async () => {
      try {
        const q = query(
          collection(db, `delivery-${props.regionCollectionName}`),
          where("type", "==", "Deliver"),
          where("status", "==", "Finish"),
          where("finish_date", "==", formattedDate)
        );

        onSnapshot(q, (snapshot) => {
          const items: ListItem[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            items.push({
              id: doc.id,
              name: data.name,
              phone: data.phone,
              note: data.note,
              status: data.status,
              type: data.type,
              position: data.position,
              finish_time: data.finish_time,
              driver: data.driver,
            });
          });

          const orderedFinishDeliveryList = items.slice().sort((a, b) => {
            const timeA = a.finish_time.toUpperCase();
            const timeB = b.finish_time.toUpperCase();

            if (timeA < timeB) {
              return -1;
            }
            if (timeA > timeB) {
              return 1;
            }
            return 0;
          });
          setListFinishDelivery(orderedFinishDeliveryList);
        });
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    const fetchDataCancelPickUp = async () => {
      try {
        const q = query(
          collection(db, `delivery-${props.regionCollectionName}`),
          where("type", "==", "Pick Up"),
          where("status", "==", "Cancel"),
          where("finish_date", "==", formattedDate)
        );

        onSnapshot(q, (snapshot) => {
          const items: ListItem[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            items.push({
              id: doc.id,
              name: data.name,
              phone: data.phone,
              note: data.note,
              status: data.status,
              type: data.type,
              position: data.position,
              finish_time: data.finish_time,
              driver: data.driver,
            });
          });
          const orderedCancelPickUpList = items
            .slice()
            .sort((a, b) => a.position - b.position);
          setListCancelPickUp(orderedCancelPickUpList);
        });
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    const fetchDataCancelDeliver = async () => {
      try {
        const q = query(
          collection(db, `delivery-${props.regionCollectionName}`),
          where("type", "==", "Deliver"),
          where("status", "==", "Cancel"),
          where("finish_date", "==", formattedDate)
        );

        onSnapshot(q, (snapshot) => {
          const items: ListItem[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            items.push({
              id: doc.id,
              name: data.name,
              phone: data.phone,
              note: data.note,
              status: data.status,
              type: data.type,
              position: data.position,
              finish_time: data.finish_time,
              driver: data.driver,
            });
          });
          const orderedCancelDeliveryList = items
            .slice()
            .sort((a, b) => a.position - b.position);
          setListCancelDelivery(orderedCancelDeliveryList);
        });
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    const fetchAllData = async () => { 
      await fetchDataPickUp();
      await fetchDataDeliver();
      await fetchDataFinishPickUp();
      await fetchDataFinishDeliver();
      await fetchDataCancelPickUp();
      await fetchDataCancelDeliver();
      props.setLoading(false);
    };

    fetchAllData();
  }, []);

  const handleDragStartPickUp = (
    e: React.DragEvent<HTMLLIElement>,
    index: number
  ) => {
    e.dataTransfer.setData("index", index.toString());
  };

  const handleDragOverPickUp = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
  };

  const handleDropPickUp = async (
    e: React.DragEvent<HTMLLIElement>,
    newIndex: number
  ) => {
    const oldIndex = parseInt(e.dataTransfer.getData("index"), 10);
    const newList = [...listPickUp];
    const item = newList.splice(oldIndex, 1)[0];
    newList.splice(newIndex, 0, item);
    setListPickUp(newList);

    const updatedList = newList.map((item, index) => ({
      ...item,
      position: index,
    }));
    try {
      const batch = writeBatch(db);
      updatedList.forEach((item) => {
        const docRef = doc(
          db,
          `delivery-${props.regionCollectionName}`,
          item.id
        );
        batch.update(docRef, { position: item.position });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error updating positions:", error);
    }
  };

  const handleDragStartDelivery = (
    e: React.DragEvent<HTMLLIElement>,
    index: number
  ) => {
    e.dataTransfer.setData("index", index.toString());
  };

  const handleDragOverDelivery = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
  };

  const handleDropDelivery = async (
    e: React.DragEvent<HTMLLIElement>,
    newIndex: number
  ) => {
    const oldIndex = parseInt(e.dataTransfer.getData("index"), 10);
    const newList = [...listDelivery];
    const item = newList.splice(oldIndex, 1)[0];
    newList.splice(newIndex, 0, item);
    setListDelivery(newList);

    const updatedList = newList.map((item, index) => ({
      ...item,
      position: index,
    }));
    try {
      const batch = writeBatch(db);
      updatedList.forEach((item) => {
        const docRef = doc(
          db,
          `delivery-${props.regionCollectionName}`,
          item.id
        );
        batch.update(docRef, { position: item.position });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error updating positions:", error);
    }
  };

  return (
    <div className="grid gap-y-3 grid-cols-1 mt-3 w-full">
      <div className="">
        <h2 className="text-2xl font-bold mb-4">Ambil</h2>
        <ul className="space-y-0">
          {listPickUp.map((item, index) => (
            <li
              key={item.id}
              className="bg-white/50 px-4 shadow-sm rounded-sm cursor-move border-b-2 border-gray-300"
              draggable
              onDragStart={(e) => handleDragStartPickUp(e, index)}
              onDragOver={(e) => handleDragOverPickUp(e)}
              onDrop={(e) => handleDropPickUp(e, index)}
              onClick={() =>
                props.setOpenEditForm({ status: true, details: item })
              }
            >
              <div className="flex gap-x-3">
                <div className="font-bold text-base sm:text-lg">
                  {item.name} <span className="text-red-500">{item.note}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="">
        <h2 className="text-2xl font-bold mb-4">Antar</h2>
        <ul className="space-y-0">
          {listDelivery.map((item, index) => (
            <li
              key={item.id}
              className="bg-white/50 px-4 shadow-sm rounded-sm cursor-move border-b-2 border-gray-300"
              draggable
              onDragStart={(e) => handleDragStartDelivery(e, index)}
              onDragOver={(e) => handleDragOverDelivery(e)}
              onDrop={(e) => handleDropDelivery(e, index)}
              onClick={() =>
                props.setOpenEditForm({ status: true, details: item })
              }
            >
              <div className="flex gap-x-3">
                <div className="font-bold text-base sm:text-lg">
                  {item.name} <span className="text-red-500">{item.note}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="">
        <h2 className="text-2xl font-bold mb-4">Selesai Ambil</h2>
        <ul className="space-y-0">
          {listFinishPickUp.map((item, index) => (
            <li
              key={item.id}
              className="bg-white/50 px-4 shadow-sm rounded-sm border-b-2 border-gray-300"
            >
              <div className="flex gap-x-3">
                <div className="font-bold text-base sm:text-lg">
                  {item.name} <span className="text-red-500">{item.note}</span>{" "}
                  {item.finish_time}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="">
        <h2 className="text-2xl font-bold mb-4">Selesai Antar</h2>
        <ul className="space-y-0">
          {listFinishDelivery.map((item, index) => (
            <li
              key={item.id}
              className="bg-white/50 px-4 shadow-sm rounded-sm border-b-2 border-gray-300"
            >
              <div className="flex gap-x-3">
                <div className="font-bold text-base sm:text-lg">
                  {item.name} <span className="text-red-500">{item.note}</span>{" "}
                  {item.finish_time}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="">
        <h2 className="text-2xl font-bold mb-4">Cancel Ambil</h2>
        <ul className="space-y-0">
          {listCancelPickUp.map((item, index) => (
            <li
              key={item.id}
              className="bg-white/50 px-4 shadow-sm rounded-sm border-b-2 border-gray-300"
            >
              <div className="flex gap-x-3">
                <div className="font-bold text-base sm:text-lg">
                  {item.name} <span className="text-red-500">{item.note}</span>{" "}
                  {item.finish_time}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="">
        <h2 className="text-2xl font-bold mb-4">Cancel Antar</h2>
        <ul className="space-y-0">
          {listCancelDelivery.map((item, index) => (
            <li
              key={item.id}
              className="bg-white/50 px-4 shadow-sm rounded-sm border-b-2 border-gray-300"
            >
              <div className="flex gap-x-3">
                <div className="font-bold text-base sm:text-lg">
                  {item.name} <span className="text-red-500">{item.note}</span>{" "}
                  {item.finish_time}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DragNDropList;
