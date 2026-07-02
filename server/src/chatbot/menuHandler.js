// src/chatbot/menuHandler.js

import { updateChatState } from "./stateManager.js";

export const showMainMenu = async (message) => {

    await message.reply(
        `👋 *Welcome to Majisa Web Solutions*

Please choose a service:

1️⃣ Website Development
2️⃣ Mobile App
3️⃣ Software
4️⃣ AI Solutions
5️⃣ Automation
6️⃣ E-Commerce
7️⃣ Digital Marketing
8️⃣ UI/UX
9️⃣ AR/VR
🔟 Talk to Executive`
    );

    await updateChatState(
        message.from,
        "MAIN_MENU"
    );

};