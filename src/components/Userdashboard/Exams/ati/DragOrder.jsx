import React, { useState } from "react";
import styles from "./DragOrder.module.css";

export default function DragOrder({ items, onSave, initialOrder }) {
  const order = initialOrder && initialOrder.length ? initialOrder.slice() : items.map(i => i.id);
  const [list, setList] = useState(order.map(id => items.find(it => String(it.id) === String(id))));
  const [draggingIndex, setDraggingIndex] = useState(null);

  function onDragStart(e, idx) {
    e.dataTransfer.setData("text/plain", String(idx));
    setDraggingIndex(idx);
    e.target.style.opacity = "0.4";
  }

  function onDragEnd(e) {
    e.target.style.opacity = "1";
    setDraggingIndex(null);
  }

  function onDrop(e, idx) {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData("text/plain"));
    if (isNaN(from)) return;
    
    const temp = list.slice();
    const [moved] = temp.splice(from, 1);
    temp.splice(idx, 0, moved);
    setList(temp);
  }

  function allowDrop(e) { 
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  }

  function onDragOver(e, idx) {
    e.preventDefault();
    const draggedOver = document.getElementById(`item-${idx}`);
    if (draggedOver) {
      draggedOver.style.transform = "scale(1.02)";
    }
  }

  function onDragLeave(e, idx) {
    const draggedOver = document.getElementById(`item-${idx}`);
    if (draggedOver) {
      draggedOver.style.transform = "scale(1)";
    }
  }

  const save = () => {
    onSave(list.map(l => l.id));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>📋</span>
        <span>Drag to reorder items</span>
      </div>
      
      <div className={styles.list}>
        {list.map((it, idx) => (
          <div
            key={it.id}
            id={`item-${idx}`}
            className={`${styles.item} ${draggingIndex === idx ? styles.dragging : ''}`}
            draggable
            onDragStart={(e) => onDragStart(e, idx)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => onDragOver(e, idx)}
            onDragLeave={(e) => onDragLeave(e, idx)}
            onDrop={(e) => onDrop(e, idx)}
          >
            <div className={styles.dragHandle}>⋮⋮</div>
            <div className={styles.rank}>{idx + 1}</div>
            <div className={styles.content} dangerouslySetInnerHTML={{__html: it.text_html}} />
          </div>
        ))}
      </div>
      
      <div className={styles.actions}>
        <button className={styles.saveBtn} onClick={save}>
          💾 Save Order
        </button>
      </div>
    </div>
  );
}