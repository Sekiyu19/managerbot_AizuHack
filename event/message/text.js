import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const eventDB = new JsonDB(new Config('db/eventDB.json', true, true, '/'));
const memberDB = new JsonDB(new Config('db/memberDB.json', true, true, '/'));
const contextDB = new JsonDB(new Config('db/contextDB.json', true, true, '/'));
let count = 1;

let eventName;
let eventDate;
let memberName;
let memberId;

const cron = require('node-cron');

const isGroup = (event) => event.source.type === 'group';

// テキストメッセージの処理をする関数
export const textEvent = async (event, client) => {
  let message;
  let { userId } = event.source;
  if (isGroup(event)) {
    userId = event.source.groupId;
  }
  // テキストメッセージの処理をする関数
  let contextData;
  let memberData;
  let eventMemoData;
  try {
    contextData = contextDB.getData(`/${userId}/context`);
  } catch (_) {
    contextData = undefined;
  }
  try {
    eventMemoData = eventDB.getData(`/${userId}/event/1/eventName`);
  } catch (_) {
    eventMemoData = undefined;
  }
  try {
    memberData = memberDB.getData(`/${userId}/member`);
  } catch (_) {
    memberData = undefined;
  }
  // 定期実行
  // const now = new Date();
  // let hour = now.getHours();
  // let min = now.getMinutes() + 1;
  // if (min === 59) {
  //   min = 0;
  //   hour++;
  // }
  // cron.schedule(`00 ${min} ${hour} * * *`, () => {
  cron.schedule('0 0 * * * *', () => {
    const date = new Date();
    const dateA = date.toDateString(2);
    const dateB = dateA.split(' ');
    let eventdateTmp;
    let countA = 0;
    for (let j = 1; j <= 31; j++) {
      try {
        eventdateTmp = eventDB.getData(`/${userId}/event/${j}/eventDate`);
        if (eventdateTmp === dateB[2]) {
          countA = 1;
          console.log(countA);
          break;
        }
        // console.log(eventdateTmp);
        // console.log(dateB[2]);
        // console.log(date.toString);
      } catch (_) {
        // console.log('a');
      }
    }
    if (countA === 1) {
      // contextDB.push(`/${userId}/context`, 'eventInfomode2');
      let eventInfo = null;
      let availabledateTmp = null;
      let activeMember;
      // eventDate = date[2];
      eventName = eventDB.getData(`/${userId}/event/${dateB[2]}/eventName`);
      eventInfo = `${dateB[2]}日: 「${eventName}」`;
      const memberNum = 10;
      for (let i = 1; i <= memberNum; i++) {
        let countC = 0;
        for (let j = 1; j <= 31; j++) {
          try {
            availabledateTmp = memberDB.getData(`/${userId}/member/${i}/availabledate/${j}/date`);// 問題児
            if (availabledateTmp === dateB[2]) { countC = 1; }
          } catch (_) {
            // memberDB.push(`/${userId}/member/${i}/availabledate/${j}/date`, null);
          }
        }
        // console.log('aaa');
        try {
          if (countC === 1) {
            activeMember = `\n  o${memberDB.getData(`/${userId}/member/${i}/name`)}(${memberDB.getData(`/${userId}/member/${i}/Position`)})`;
            eventInfo += (activeMember);
          } else {
            activeMember = `\n  x${memberDB.getData(`/${userId}/member/${i}/name`)}(${memberDB.getData(`/${userId}/member/${i}/Position`)})`;
            eventInfo += (activeMember);
          }
        } catch (_) {
          // undef
        }
      }
      console.log(eventInfo);
      // return {
      //   type: 'text',
      //   text: eventInfo,
      // };
      message = {
        type: 'text',
        text: eventInfo,
      };
    }
  });
  // contextDataで条件分岐
  switch (contextData) {
    // もしそのユーザーのcontextがmemoModeだったら
    case 'eventMemoMode': {
      // メッセージをDBへ保存
      eventDate = event.message.text;
      // contextをDBから削除
      contextDB.delete(`/${userId}/context`);
      // 返信するメッセージをreturnする
      contextDB.push(`/${userId}/context`, 'eventMemoMode2');
      return {
        type: 'text',
        text: `${event.message.text}"日の予定を入力してください`,
      };
    }
    case 'eventMemoMode2': {
      // メッセージをDBへ保存
      eventName = event.message.text;
      // eventMessageDB.push(`/${userId}/event/${countE}`, { eventDate: `${event.message.text}` });
      eventDB.push(`/${userId}/event/${eventDate}`, { eventName, eventDate });
      // contextをDBから削除
      contextDB.delete(`/${userId}/context`);

      // 返信するメッセージをreturnする
      return {
        type: 'text',
        text: `${eventDate}日に${eventName}を追加しました`,
      };
    }
    case 'eventRemMode': {
      eventDB.delete(`/${userId}/event/${event.message.text}`);
      contextDB.delete(`/${userId}/context`);
      return {
        type: 'text',
        text: `${event.message.text}日のイベントを削除しました`,
      };
    }
    case 'eventReMode': {
      eventDate = event.message.text;
      eventDB.delete(`/${userId}/event/${event.message.text}`);
      contextDB.delete(`/${userId}/context`);
      contextDB.push(`/${userId}/context`, 'eventMemoMode2');
      return {
        type: 'text',
        text: `${event.message.text}日のイベントを入力してください`,
      };
    }
    case 'eventInfoMode': {
      let eventInfo = null;
      let availabledateTmp = null;
      let activeMember;
      eventDate = event.message.text;
      eventName = eventDB.getData(`/${userId}/event/${event.message.text}/eventName`);
      eventInfo = `${eventDate}日: 「${eventName}」`;
      const memberNum = 10;
      for (let i = 1; i <= memberNum; i++) {
        let countA = 0;
        for (let j = 1; j <= 31; j++) {
          try {
            availabledateTmp = memberDB.getData(`/${userId}/member/${i}/availabledate/${j}/date`);// 問題児
            if (availabledateTmp === eventDate) { countA = 1; }
          } catch (_) {
            // memberDB.push(`/${userId}/member/${i}/availabledate/${j}/date`, null);
          }
        }
        try {
          if (countA === 1) {
            activeMember = `\n  o${memberDB.getData(`/${userId}/member/${i}/name`)}(${memberDB.getData(`/${userId}/member/${i}/Position`)})`;
            eventInfo += (activeMember);
          } else {
            activeMember = `\n  x${memberDB.getData(`/${userId}/member/${i}/name`)}(${memberDB.getData(`/${userId}/member/${i}/Position`)})`;
            eventInfo += (activeMember);
          }
        } catch (_) {
          // undef
        }
      }
      contextDB.delete(`/${userId}/context`);
      return {
        type: 'text',
        text: eventInfo,
      };
    }
    case 'eventInfomode2': {
      const dateB = new Date();
      const dateA = dateB.toDateString();
      const date = dateA.split(' ');
      let eventInfo = null;
      let availabledateTmp = null;
      let activeMember;
      // eventDate = date[2];
      eventName = eventDB.getData(`/${userId}/event/${date[2]}/eventName`);
      eventInfo = `${date[2]}日: 「${eventName}」`;
      const memberNum = 10;
      for (let i = 1; i <= memberNum; i++) {
        let countA = 0;
        for (let j = 1; j <= 31; j++) {
          try {
            availabledateTmp = memberDB.getData(`/${userId}/member/${i}/availabledate/${j}/date`);// 問題児
            if (availabledateTmp === date[2]) { countA = 1; }
          } catch (_) {
            // memberDB.push(`/${userId}/member/${i}/availabledate/${j}/date`, null);
          }
        }
        // console.log('aaa');
        try {
          if (countA === 1) {
            activeMember = `\n  o${memberDB.getData(`/${userId}/member/${i}/name`)}(${memberDB.getData(`/${userId}/member/${i}/Position`)})`;
            eventInfo += (activeMember);
          } else {
            activeMember = `\n  x${memberDB.getData(`/${userId}/member/${i}/name`)}(${memberDB.getData(`/${userId}/member/${i}/Position`)})`;
            eventInfo += (activeMember);
          }
        } catch (_) {
          // undef
        }
      }
      contextDB.delete(`/${userId}/context`);
      return {
        type: 'text',
        text: eventInfo,
      };
    }
    case 'addMemberName': {
      memberName = `${event.message.text}`;
      contextDB.push(`/${userId}/context`, 'addMemberPosition');
      return {
        type: 'text',
        text: '追加するメンバーの役職を入力してください。',
      };
    }
    case 'addMemberPosition': {
      memberDB.push(`/${userId}/member/${count}`, { id: `${count++}`, name: `${memberName}`, Position: `${event.message.text}` }, false);
      // contextをDBから削除
      contextDB.delete(`/${userId}/context`);
      // 返信するメッセージをreturnする
      return {
        type: 'text',
        text: `${memberName} さんをメンバーに追加しました。`,
      };
    }
    case 'editMember': {
      memberId = `${event.message.text}`;
      contextDB.push(`/${userId}/context`, 'editMemberName');
      return {
        type: 'text',
        text: '新しい名前を入力してください。',
      };
    }
    case 'editMemberName': {
      memberName = `${event.message.text}`;
      contextDB.push(`/${userId}/context`, 'editMemberPosition');
      return {
        type: 'text',
        text: '新しい役職を入力してください。',
      };
    }
    case 'editMemberPosition': {
      memberDB.push(`/${userId}/member/${memberId}`, { name: `${memberName}`, Position: `${event.message.text}` }, false);
      // contextをDBから削除
      contextDB.delete(`/${userId}/context`);
      // 返信するメッセージをreturnする
      return {
        type: 'text',
        text: `${memberName} さんに変更しました。`,
      };
    }
    case 'deleteMember': {
      let deleteMemberName;
      try {
        deleteMemberName = memberDB.getData(`/${userId}/member/${event.message.text}/name`);
      } catch (_) {
        deleteMemberName = undefined;
      }
      contextDB.delete(`/${userId}/context`);
      if (deleteMemberName) {
        memberDB.delete(`/${userId}/member/${event.message.text}`);
        return {
          type: 'text',
          text: `${deleteMemberName}さんをメンバーから削除しました。`,
        };
      }
      return {
        type: 'text',
        text: `IDが${event.message.text}のメンバーは存在しません。`,
      };
    }
    case 'getMemberId': {
      memberId = `${event.message.text}`;
      contextDB.delete(`/${userId}/context`);
      let member;
      try {
        member = memberDB.getData(`/${userId}/member/${event.message.text}`);
      } catch (_) {
        member = undefined;
      }
      if (member) {
        message = {
          type: 'text',
          text: 'メンバーの参加可能日の設定を行います。',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '追加',
                  text: '参加可能日追加',
                },
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '削除',
                  text: '参加可能日削除',
                },
              },
            ],
          },
        };
      } else {
        message = {
          type: 'text',
          text: `IDが${memberId}のメンバーは存在しません。`,
        };
      }
      return message;
    }
    case 'addavailabledate': {
      memberDB.push(`/${userId}/member/${memberId}/availabledate/${event.message.text}`, { date: `${event.message.text}` }, false);
      contextDB.delete(`/${userId}/context`);
      return {
        type: 'text',
        text: `参加可能日に${event.message.text}日を追加しました。`,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'message',
                label: '追加',
                text: '参加可能日追加',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '削除',
                text: '参加可能日削除',
              },
            },
          ],
        },
      };
    }
    case 'deleteavailabledate': {
      memberDB.push(`/${userId}/member/${memberId}/availabledate/${event.message.text}`);
      contextDB.delete(`/${userId}/context`);
      return {
        type: 'text',
        text: `参加可能日から${event.message.text}を削除しました。`,
      };
    }
    default:
      break;
  }
  // メッセージのテキストごとに条件分岐
  switch (event.message.text) {
    // 'メモ'というメッセージが送られてきた時

    // 最初の設定画面
    case '日程調整': {
      message = {
        type: 'template',
        altText: 'ボタンテンプレート',
        template: {
          type: 'buttons',
          thumbnailImageUrl: 'https://1.bp.blogspot.com/-4CUcc9q8aFQ/X7zMWWGRmpI/AAAAAAABcaE/nfdSqmkx9RQL0ZoBisukxdD-qdjJS28iQCNcBGAsYHQ/s830/calender_schedule_half.png',
          imageAspectRatio: 'rectangle',
          imageSize: 'cover',
          imageBackgroundColor: '#FFFFFF',
          title: '日程調整',
          text: '各種設定',
          defaultAction: {
            type: 'uri',
            label: 'View detail',
            uri: 'https://shinbunbun.info/images/photos/',
          },
          actions: [
            {
              type: 'message',
              label: 'イベントの設定',
              text: 'イベントの設定',
            },
            {
              type: 'message',
              label: 'メンバーの設定',
              text: 'メンバーの設定',
            },
            {
              type: 'message',
              label: 'テンプレートの設定',
              text: 'テンプレートの設定',
            },
            {
              type: 'message',
              label: 'その他設定',
              text: 'その他の設定',
            },
          ],
        },
      };
      break;
    }

    // イベントの設定
    case 'イベントの設定': {
      message = {
        type: 'text',
        text: 'イベントの操作を選んでください',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'message',
                text: 'イベントの追加',
                label: 'イベントの追加',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                text: 'イベントの削除',
                label: 'イベントの削除',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                text: 'イベントの一括削除',
                label: 'イベントの一括削除',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                text: 'イベントの編集',
                label: 'イベントの編集',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                text: 'イベントの一覧',
                label: 'イベントの一覧',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                text: 'イベントの詳細',
                label: 'イベントの詳細',
              },
            },
          ],
        },
      };
      break;
    }

    case 'イベントの一覧': {
      // メモのデータがDBに存在する時
      if (eventMemoData) {
        let eventTmp;
        let Data = null;
        // 返信するメッセージを作成
        message = {
          type: 'text',
          text: '以下のイベントが保存されています\n',
        };
        for (let i = 1; i <= 31; i++) {
          try {
            eventTmp = eventDB.getData(`/${userId}/event/${i}/eventName`);
          } catch (_) {
            eventDB.push(`/${userId}/event/${i}/eventName`, '休み');
            eventDB.push(`/${userId}/event/${i}/eventdate`, null);
          }
          if (i === 1) {
            Data = `${i}:${eventDB.getData(`/${userId}/event/${i}/eventName`)}`;
          } else {
            Data += `\n${i}:${eventDB.getData(`/${userId}/event/${i}/eventName`)}`;
          }
        }
        message = {
          type: 'text',
          text: Data,
        };
      } else {
        // 返信するメッセージを作成
        message = {
          type: 'text',
          text: 'イベントが存在しません',
        };
      }
      break;
    }
    // 'イベントの追加'というメッセージが送られてきた時
    case 'イベントの追加': {
      // DBにcontextを追加
      contextDB.push(`/${userId}/context`, 'eventMemoMode');
      // 返信するメッセージを作成
      message = {
        type: 'text',
        text: 'イベントの日付を入力してください',
      };
      break;
    }
    case 'イベントの削除': {
      contextDB.push(`/${userId}/context`, 'eventRemMode');
      message = {
        type: 'text',
        text: '削除する日付を入力してください',
      };
      break;
    }
    case 'イベントの一括削除': {
      eventDB.delete(`/${userId}/event/`);
      message = {
        type: 'text',
        text: 'すべてのイベントを削除しました',
      };
      break;
    }
    case 'イベントの編集': {
      contextDB.push(`/${userId}/context`, 'eventReMode');
      message = {
        type: 'text',
        text: '何日のイベントを編集しますか?',
      };
      break;
    }
    case 'イベントの詳細': {
      contextDB.push(`/${userId}/context`, 'eventInfoMode');
      message = {
        type: 'text',
        text: '何日のイベントの詳細を表示しますか?',
      };
      break;
    }

    case 'メンバーの設定': {
      // 返信するメッセージを作成
      message = {
        type: 'text',
        text: 'メンバーの設定を行います。',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'message',
                label: '追加',
                text: 'メンバーの追加',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '削除',
                text: 'メンバーの削除',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '編集',
                text: 'メンバーの編集',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '一覧',
                text: 'メンバーの一覧',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '参加可能日設定',
                text: 'メンバーの参加可能日設定',
              },
            },
          ],
        },
      };
      break;
    }

    case 'メンバーの参加可能日設定': {
      if (memberData) {
        // 返信するメッセージを作成
        let id;
        let member;
        let Data;
        for (let i = 1; i <= 3; i++) {
          try {
            id = memberDB.getData(`/${userId}/member/${i}/id`);
            member = memberDB.getData(`/${userId}/member/${i}/name`);
          } catch (_) {
            member = undefined;
          }
          if (member) {
            if (i == 1) {
              Data = `ID:${id} ${member} さん`;
            } else {
              Data += '\n' + `ID:${id} ${member} さん`;
            }
          }
        }
        contextDB.push(`/${userId}/context`, 'getMemberId');
        message = {
          type: 'text',
          text: `参加可能日を設定するメンバーのIDを入力してください。\n${Data}`,
        };
      } else {
        // 返信するメッセージを作成
        message = {
          type: 'text',
          text: 'メンバーが存在しません',
        };
      }
      break;
    }

    case '参加可能日追加': {
      contextDB.push(`/${userId}/context`, 'addavailabledate');
      // 返信するメッセージを作成
      message = {
        type: 'text',
        text: '追加する参加可能日を入力してください。',
      };
      break;
    }

    case '参加可能日削除': {
      contextDB.push(`/${userId}/context`, 'deleteavailabledate');
      // 返信するメッセージを作成
      message = {
        type: 'text',
        text: '削除する参加可能日を入力してください。',
      };
      break;
    }

    case 'イベント候補日': {
      let availabledate = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (let i = 1; i <= Object.keys(memberData).length; i++) {
        for (let j = 1; j <= 31; j++) {
          let existFlg;
          try {
            existFlg = memberDB.getData(`/${userId}/member/${i}/availabledate/${j}`);
          } catch (_) {
            existFlg = undefined;
          }
          if (existFlg) {
            availabledate[j]++;
          }
        }
      }
      let countDate = 0;
      let date = undefined;
      for (let i = 1; i <= 31; i++) {
        if (countDate < availabledate[i]) {
          countDate = availabledate[i];
        }
      }
      for (let i = 1; i <= 31; i++) {
        if (countDate === availabledate[i]) {
          date ? date += `\n${i}日` : date = `${i}日`;
        }
      }
      // 返信するメッセージを作成
      message = {
        type: 'text',
        text: date ? `イベント候補日\n${date}` : `参加可能日が登録されていません。`,
      };
      break;
    }

    case 'メンバーの追加': {
      contextDB.push(`/${userId}/context`, 'addMemberName');
      // 返信するメッセージを作成
      message = {
        type: 'text',
        text: '追加するメンバーの名前を入力してください。',
      };
      break;
    }

    case 'メンバーの編集': {
      if (memberData) {
        contextDB.push(`/${userId}/context`, 'editMember');
        // 返信するメッセージを作成
        let id;
        let member;
        let Data;
        for (let i = 1; i <= 3; i++) {
          try {
            id = memberDB.getData(`/${userId}/member/${i}/id`);
            member = memberDB.getData(`/${userId}/member/${i}/name`);
          } catch (_) {
            member = undefined;
          }
          if (member) {
            if (i == 1) {
              Data = `ID:${id} ${member} さん`;
            } else {
              Data += '\n' + `ID:${id} ${member} さん`;
            }
          }
        }
        message = {
          type: 'text',
          text: `編集するメンバーのIDを入力してください。\n${Data}`,
        };
      } else {
        message = {
          type: 'text',
          text: 'メンバーが存在しません',
        };
      }
      break;
    }

    case 'メンバーの削除': {
      if (memberData) {
        contextDB.push(`/${userId}/context`, 'deleteMember');
        // 返信するメッセージを作成
        let id;
        let member;
        let Data;
        for (let i = 1; i <= 3; i++) {
          try {
            id = memberDB.getData(`/${userId}/member/${i}/id`);
            member = memberDB.getData(`/${userId}/member/${i}/name`);
          } catch (_) {
            member = undefined;
          }
          if (member) {
            if (i == 1) {
              Data = `ID:${id} ${member} さん`;
            } else {
              Data += '\n' + `ID:${id} ${member} さん`;
            }
          }
        }
        message = {
          type: 'text',
          text: `削除するメンバーのIDを入力してください\n${Data}`,
        };
        break;
      } else {
        message = {
          type: 'text',
          text: 'メンバーが存在しません',
        };
      }
    }

    case '削除': {
      memberDB.delete('/');
      count = 1;
      break;
    }

    case 'メンバーの一覧': {
      if (memberData) {
        // 返信するメッセージを作成
        let id;
        let member;
        let Data;
        for (let i = 1; i <= 3; i++) {
          try {
            id = memberDB.getData(`/${userId}/member/${i}/id`);
            member = memberDB.getData(`/${userId}/member/${i}/name`);
          } catch (_) {
            member = undefined;
          }
          if (member) {
            if (i == 1) {
              Data = `ID:${id} ${member} さん`;
            } else {
              Data += '\n' + `ID:${id} ${member} さん`;
            }
          }
        }
        message = {
          type: 'text',
          text: `日程調整Botには以下のメンバーが登録されています。\n${Data}`,
        };
      } else {
        // 返信するメッセージを作成
        message = {
          type: 'text',
          text: 'メンバーが存在しません',
        };
      }
      break;
    }

    // 'こんにちは'というメッセージが送られてきた時
    case 'こんにちは': {
      // 返信するメッセージを作成
      //const d = Date();
      //console.log(Date());
      message = {
        type: 'text',
        text: `Hello, world ${Date()}`,
      };
      // contextDB.push(`/${userId}/context`, 'eventInfomode2');
      break;
    }
    // '複数メッセージ'というメッセージが送られてきた時
    case '複数メッセージ': {
      // 返信するメッセージを作成
      message = [
        {
          type: 'text',
          text: 'Hello, user',
        },
        {
          type: 'text',
          text: 'May I help you?',
        },
      ];
      break;
    }
    // 'クイックリプライ'というメッセージが送られてきた時
    case 'クイックリプライ': {
      // 返信するメッセージを作成
      message = {
        type: 'text',
        text: 'クイックリプライ（以下のアクションはクイックリプライ専用で、他のメッセージタイプでは使用できません）',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'camera',
                label: 'カメラを開く',
              },
            },
            {
              type: 'action',
              action: {
                type: 'cameraRoll',
                label: 'カメラロールを開く',
              },
            },
            {
              type: 'action',
              action: {
                type: 'location',
                label: '位置情報画面を開く',
              },
            },
          ],
        },
      };
      break;
    }
    // 'スタンプメッセージ'というメッセージが送られてきた時
    case 'スタンプメッセージ': {
      // 返信するメッセージを作成
      message = {
        type: 'sticker',
        packageId: '446',
        stickerId: '1988',
      };
      break;
    }
    // '画像メッセージ'というメッセージが送られてきた時
    case '画像メッセージ': {
      // 返信するメッセージを作成
      message = {
        type: 'image',
        originalContentUrl: 'https://shinbunbun.info/images/photos/7.jpeg',
        previewImageUrl: 'https://shinbunbun.info/images/photos/7.jpeg',
      };
      break;
    }
    // '音声メッセージ'というメッセージが送られてきた時
    case '音声メッセージ': {
      // 返信するメッセージを作成
      message = {
        type: 'audio',
        originalContentUrl:
          'https://github.com/shinbunbun/aizuhack-bot/blob/master/media/demo.m4a?raw=true',
        duration: 6000,
      };
      break;
    }
    // '動画メッセージ'というメッセージが送られてきた時
    case '動画メッセージ': {
      // 返信するメッセージを作成
      message = {
        type: 'video',
        originalContentUrl: 'https://github.com/shinbunbun/aizuhack-bot/blob/master/media/demo.mp4?raw=true',
        previewImageUrl: 'https://raw.githubusercontent.com/shinbunbun/aizuhack-bot/master/media/thumbnail.jpg?raw=true',
      };
      break;
    }
    // '位置情報メッセージ'というメッセージが送られてきた時
    case '位置情報メッセージ': {
      // 返信するメッセージを作成
      message = {
        type: 'location',
        title: 'my location',
        address: '〒160-0004 東京都新宿区四谷一丁目6番1号',
        latitude: 35.687574,
        longitude: 139.72922,
      };
      break;
    }
    // 'イメージマップメッセージ'というメッセージが送られてきた時
    case 'イメージマップメッセージ': {
      // イメージマップの画像の作成方法には細かい指定があります。参考→https://developers.line.biz/ja/reference/messaging-api/#imagemap-message
      message = [
        {
          type: 'imagemap',
          baseUrl:
            'https://github.com/shinbunbun/aizuhack-bot/blob/master/media/imagemap.png?raw=true',
          altText: 'This is an imagemap',
          baseSize: {
            width: 1686,
            height: 948,
          },
          actions: [
            {
              type: 'uri',
              area: {
                x: 590,
                y: 179,
                width: 511,
                height: 585,
              },
              linkUri: 'https://shinbunbun.info/about/',
            },
            {
              type: 'message',
              area: {
                x: 0,
                y: 0,
                width: 458,
                height: 948,
              },
              text: 'しんぶんぶん！！！',
            },
            {
              type: 'message',
              area: {
                x: 1230,
                y: 0,
                width: 456,
                height: 948,
              },
              text: 'しんぶんぶん！！！',
            },
          ],
        },
        {
          type: 'text',
          text: '画像の色々なところをタップしてみよう！',
        },
      ];
      break;
    }
    // 'ボタンテンプレート'というメッセージが送られてきた時
    case 'ボタンテンプレート': {
      // 返信するメッセージを作成
      message = {
        type: 'template',
        altText: 'ボタンテンプレート',
        template: {
          type: 'buttons',
          thumbnailImageUrl: 'https://shinbunbun.info/images/photos/7.jpeg',
          imageAspectRatio: 'rectangle',
          imageSize: 'cover',
          imageBackgroundColor: '#FFFFFF',
          title: 'ボタンテンプレート',
          text: 'ボタンだお',
          defaultAction: {
            type: 'uri',
            label: 'View detail',
            uri: 'https://shinbunbun.info/images/photos/',
          },
          actions: [
            {
              type: 'postback',
              label: 'ポストバックアクション',
              data: 'button-postback',
            },
            {
              type: 'message',
              label: 'メッセージアクション',
              text: 'button-message',
            },
            {
              type: 'uri',
              label: 'URIアクション',
              uri: 'https://shinbunbun.info/',
            },
            {
              type: 'datetimepicker',
              label: '日時選択アクション',
              data: 'button-date',
              mode: 'datetime',
              initial: '2021-06-01t00:00',
              max: '2022-12-31t23:59',
              min: '2021-06-01t00:00',
            },
          ],
        },
      };
      break;
    }
    // '確認テンプレート'というメッセージが送られてきた時
    case '確認テンプレート': {
      // 返信するメッセージを作成
      message = {
        type: 'template',
        altText: '確認テンプレート',
        template: {
          type: 'confirm',
          text: '確認テンプレート',
          actions: [
            {
              type: 'message',
              label: 'はい',
              text: 'yes',
            },
            {
              type: 'message',
              label: 'いいえ',
              text: 'no',
            },
          ],
        },
      };
      break;
    }
    // 'カルーセルテンプレート'というメッセージが送られてきた時
    case 'カルーセルテンプレート': {
      // 返信するメッセージを作成
      message = {
        type: 'template',
        altText: 'カルーセルテンプレート',
        template: {
          type: 'carousel',
          columns: [
            {
              thumbnailImageUrl: 'https://shinbunbun.info/images/photos/7.jpeg',
              imageBackgroundColor: '#FFFFFF',
              title: 'タイトル1',
              text: '説明1',
              defaultAction: {
                type: 'uri',
                label: 'View detail',
                uri: 'https://shinbunbun.info/',
              },
              actions: [
                {
                  type: 'postback',
                  label: 'ポストバック',
                  data: 'postback-carousel-1',
                },
                {
                  type: 'uri',
                  label: 'URIアクション',
                  uri: 'https://shinbunbun.info/',
                },
              ],
            },
            {
              thumbnailImageUrl:
                'https://shinbunbun.info/images/photos/10.jpeg',
              imageBackgroundColor: '#FFFFFF',
              title: 'タイトル2',
              text: '説明2',
              defaultAction: {
                type: 'uri',
                label: 'View detail',
                uri: 'https://shinbunbun.info/',
              },
              actions: [
                {
                  type: 'postback',
                  label: 'ポストバック',
                  data: 'postback-carousel-2',
                },
                {
                  type: 'uri',
                  label: 'URIアクション',
                  uri: 'https://shinbunbun.info/',
                },
              ],
            },
          ],
          imageAspectRatio: 'rectangle',
          imageSize: 'cover',
        },
      };
      break;
    }
    // '画像カルーセルテンプレート'というメッセージが送られてきた時
    case '画像カルーセルテンプレート': {
      // 返信するメッセージを作成
      message = {
        type: 'template',
        altText: '画像カルーセルテンプレート',
        template: {
          type: 'image_carousel',
          columns: [
            {
              imageUrl: 'https://shinbunbun.info/images/photos/4.jpeg',
              action: {
                type: 'postback',
                label: 'ポストバック',
                data: 'image-carousel-1',
              },
            },
            {
              imageUrl: 'https://shinbunbun.info/images/photos/5.jpeg',
              action: {
                type: 'message',
                label: 'メッセージ',
                text: 'いえい',
              },
            },
            {
              imageUrl: 'https://shinbunbun.info/images/photos/7.jpeg',
              action: {
                type: 'uri',
                label: 'URIアクション',
                uri: 'https://shinbunbun.info/',
              },
            },
          ],
        },
      };
      break;
    }
    // 'Flex Message'というメッセージが送られてきた時
    case 'Flex Message': {
      // 返信するメッセージを作成
      message = {
        type: 'flex',
        altText: 'Flex Message',
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'Flex Message',
                color: '#FFFFFF',
                weight: 'bold',
              },
            ],
          },
          hero: {
            type: 'image',
            url: 'https://pbs.twimg.com/profile_images/1236928986212478976/wDa51i9T_400x400.jpg',
            size: 'xl',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'しんぶんぶん',
                size: 'xl',
                weight: 'bold',
                align: 'center',
              },
              {
                type: 'text',
                text: '会津大学学部一年',
                align: 'center',
              },
              {
                type: 'separator',
                margin: 'md',
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'button',
                    action: {
                      type: 'uri',
                      label: 'ホームページ',
                      uri: 'https://shinbunbun.info/',
                    },
                    style: 'primary',
                    offsetBottom: '10px',
                  },
                  {
                    type: 'button',
                    action: {
                      type: 'uri',
                      label: 'Twitter',
                      uri: 'https://twitter.com/shinbunbun_',
                    },
                    style: 'primary',
                    color: '#1DA1F2',
                  },
                ],
                paddingTop: '10px',
              },
            ],
          },
          styles: {
            header: {
              backgroundColor: '#008282',
            },
          },
        },
      };
      break;
    }
    // 'プロフィール'というメッセージが送られてきた時
    case 'プロフィール': {
      // ユーザーのプロフィール情報を取得
      const profile = await client.getProfile(event.source.userId);
      // 返信するメッセージを作成
      message = {
        type: 'text',
        text: `あなたの名前: ${profile.displayName} \nユーザーID: ${profile.userId} \nプロフィール画像のURL: ${profile.pictureUrl} \nステータスメッセージ: ${profile.statusMessage} `,
      };
      break;
    }
    // 'ここはどこ'というメッセージが送られてきた時
    case 'ここはどこ': {
      // 送信元がユーザーとの個チャだった場合
      if (event.source.type === 'user') {
        // 返信するメッセージを作成
        message = {
          type: 'text',
          text: 'ここは個チャだよ！',
        };
        // 送信元がグループだった場合
      } else if (event.source.type === 'group') {
        // 返信するメッセージを作成
        message = {
          type: 'text',
          text: 'ここはグループだよ！',
        };
      }
      break;
    }
    // 上で条件分岐した以外のメッセージが送られてきた時
    default: {
      // 返信するメッセージを作成
      message = {
        type: 'text',
        text: `受け取ったメッセージ: ${event.message.text} \nそのメッセージの返信には対応してません...`,
      };
      break;
    }
  }
  return message;
};
