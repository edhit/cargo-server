require("dotenv").config();
const {
	Telegraf,
	Markup
} = require("telegraf");

const express = require("express");
const app = express();
app.use(express.json());
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	next();
});

const bot = new Telegraf(process.env.BOT_TOKEN);

const path_url = process.env.SECRET
if (process.env.WEBHOOK === "") {
	bot.launch();
} else {
	const webhookUrl = `${process.env.WEBHOOK}/${path_url}`
	bot.telegram.setWebhook(webhookUrl);

	app.post(`/${path_url}`, (req, res) => {
		bot.handleUpdate(req.body, res);
	});
}

bot.start(async (ctx) => {
	try {
		const message_data = await ctx.reply(
			"Привет! Чтобы начать использовать бота, откройте WebApp, нажав на кнопку ниже.", {
				reply_markup: {
					inline_keyboard: [
						[{
							text: "Cargo",
							url: process.env.WEB_APP_CARGO, // Укажите URL вашего WebApp
						}, ],
					],
				},
				disable_web_page_preview: true, // Отключение превью ссылки
			}
		);

	} catch (err) {
		console.error("Ошибка при запуске:", err);
		await ctx.reply("Произошла ошибка при запуске." + err);
	}
});

bot.action(/delete_(.+)/, async (ctx) => {
	try {
		const callbackData = ctx.match[1]; // Получаем данные из группы (.+)
		const message = ctx.callbackQuery.message; // Сообщение, связанное с callback
		const [formType, messageId] = callbackData.split("_");

		if (formType === "cargo") {
			await bot.telegram.editMessageText(
				"@cargo_life", // Либо ID канала
				messageId, // ID сообщения
				undefined, // inlineMessageId, если он не используется
				`<s>${message.text}</s>\n\n<b>⭕️ Объявление снято с публикации</b>`, {
					parse_mode: "HTML", // Указывает форматирование текста
					disable_web_page_preview: true, // Отключение превью ссылки
				}
			);


			await ctx.editMessageText(
				`<s>${message.text}</s>\n\n<b>⭕️ Объявление снято с публикации</b>`, {
					parse_mode: "HTML",
					disable_web_page_preview: true, // Отключение превью ссылки
				}
			);
		}
	} catch (err) {
		console.error("Ошибка при удалении записи:", err);
		await ctx.reply("Произошла ошибка при удалении записи.");
	}
});

app.post("/api/sendMessage", async (req, res) => {
	try {
		let message, channel, message_data;
		
		if (req.body.data.form === "cargo") {
			message = `
	  📦 Отправка посылки
	  📱 Груз: ${req.body.data.type}
	  ⚖️ Вес: ${req.body.data.weight}
	  💰 Цена за кг: ${req.body.data.price}
	  📍 Откуда: ${req.body.data.from}
	  📍 Куда: ${req.body.data.to}
	  ${req.body.data.comment ? `📝 Комментарий: ${req.body.data.comment}` : ""}
		  `;
		  
			channel = 'cargo_life'
			message_data = await bot.telegram.sendMessage(
				`@${channel}`, // ID канала
				message, {
					...Markup.inlineKeyboard([
						Markup.button.url(
							"Написать автору",
							`https://t.me/${req.body.user.username}`
						),
					]),
					disable_web_page_preview: true, // Отключение превью ссылки
				}
			);
		} else if (req.body.data.form === "exchange_saudi") {
			channel = 'exchange_saudi'
			//   message_data = await bot.telegram.sendMessage(
			//     "", // ID канала
			//     message
			//     // Markup.inlineKeyboard([
			//     //   Markup.button.callback("🗑 Удалить", `delete_${savedCargo._id}`),
			//     // ])
			//   );
		}
		if (message_data && channel) {
			await bot.telegram.sendMessage(
				req.body.user.chatId, // ID пользователя
				message, {
					...Markup.inlineKeyboard([
						Markup.button.callback(
							"🛑 Снять с публикации",
							`delete_${req.body.data.form}_${message_data.message_id}`
						),
						Markup.button.url(
							"Посмотреть объявление",
							`https://t.me/${channel}/${message_data.message_id}`
						),
					]),
					disable_web_page_preview: true, // Отключение превью ссылки
				}
			);
		}

		res.send(message);
	} catch (error) {
		res.status(400).json({
			message: "Ошибка при создании записи",
			error: err.message,
		});
	}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`listening on port ${PORT}`);
});