// src/chatbot/menuHandler.js

import { updateChatState } from "./stateManager.js";

export const showMainMenu = async (message) => {

    await message.reply(
        `👋 *Welcome to Majisa Web Solutions!*\n\nWe provide complete IT solutions to help businesses grow.\n\nPlease select a service:\n\n1️⃣ Website Development\n2️⃣ Mobile Application\n3️⃣ Custom Software\n4️⃣ Cloud & DevOps\n5️⃣ AI Automation\n6️⃣ Digital Marketing\n7️⃣ Talk to Executive\n8️⃣ Portfolio\n9️⃣ Pricing\n\nReply with the number of your choice.\n\nType:\nmenu | back | restart | help`
    );

    await updateChatState(
        message.from,
        "MAIN_MENU"
    );

};