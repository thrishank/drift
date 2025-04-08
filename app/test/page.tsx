"use client";

import { useDriftStore } from "@/lib/store";

export default function page() {
  const { client } = useDriftStore();

  const user = client?.getUser();
  console.log(user);
  return <div></div>;
}
