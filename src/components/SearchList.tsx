"use client";
import cycles from "@cycles";

export default function SearchList() {
  return (
    <>
      {cycles.slice(0, 10).map((set) => (
        <div key={set.setCode}>
          {" "}
          <input type="checkbox" checked={false} onChange={() => {}} />
          <span>{set.setName}</span>
        </div>
      ))}
    </>
  );
}
