

/*
words = {
    '漢字' : {
        kana:
        description:
        aiueo:
    }
}
*/
function init_words(){
  for (let name in words){
    words[name]['aiueo'] = kana_to_aiueo(words[name]['kana']);
  }
}

//ひらがなをaiueoに変換
function kana_to_aiueo(text){
  let aiueo = pre_process(text);
  aiueo = aiueo.replace(/[あかさたなはまやらわがざだばぱゃ]/g, 'a');
  aiueo = aiueo.replace(/[いきしちにひみりぎじぢびぴ]/g, 'i');
  aiueo = aiueo.replace(/[うくすつぬふむゆるゔぐずづぶぷゅ]/g, 'u');
  aiueo = aiueo.replace(/[えけせてねへめれげぜでべぺ]/g, 'e');
  aiueo = aiueo.replace(/[おこそとのほもよろをごぞどぼぽょ]/g, 'o');
  aiueo = aiueo.replace(/[^aiueo]/g, '');

  return aiueo;

}

//かなテキストの前処理
function pre_process(text){
  let processed = text;

  //「しゃ」→「＊あ」に変換
  processed = processed.replace(/.[ぁゃ]/g, '＊あ');
  processed = processed.replace(/.[ぃ]/g, '＊い');
  processed = processed.replace(/.[ぅゅ]/g, '＊う');
  processed = processed.replace(/.[ぇ]/g, '＊え');
  processed = processed.replace(/.[ぉょ]/g, '＊お');

  //長音がついていたらその前の文字と同じ音に変換
  processed = processed.replace(/[あかさたなはまやらわがざだばぱゃ]ー/g, 'ああ');
  processed = processed.replace(/[いきしちにひみゐりぎじぢびぴ]ー/g, 'いい');
  processed = processed.replace(/[うくすつぬふむゆるゔぐずづぶぷゅ]ー/g, 'うう');
  processed = processed.replace(/[えけせてねへめゑれげぜでべぺ]ー/g, 'ええ');
  processed = processed.replace(/[おこそとのほもよろをごぞどぼぽょ]ー/g, 'おお');

  return processed;
}

function generate_in(){

  const text = document.getElementById('textarea').value;

  //ひと文字ずつ分解して配列に
  const text_list = pre_process(text).split('');
  //分解したものをaiueo配列に
  const aiueo_list = text_list.map(kana => kana_to_aiueo(kana));

  //配列を結合して元の文字列aiueoに
  const text_aiueo = aiueo_list.join('');

  //text_aiueoの文字列インデックスからaiueo_listインデックスへの変換テーブル
  //aiueo文字列のN番目は、text文字列のaiueo_text_index[N]番目に相当する
  let aiueo_text_index = [];
  for (let i = 0; i < aiueo_list.length; i++){
    if (aiueo_list[i].length > 0){
      aiueo_text_index.push(i);
    }
  }
  
  /*
  //アイドル名にマッチする部分を探す
  let idol_matches = {}
  for (let name in idol_aiueo){
    const aiueo = idol_aiueo[name];
    let matches = [];
    let start = 0;
    while (true){

      const match = text_aiueo.indexOf(aiueo, start);
      if (match < 0){
        break;
      }
      matches.push(match);
      start = match + 1;
    }
    idol_matches[name] = matches;

  }
  */

  //オプション設定
  let ng_words = [];
  if (!document.getElementById('cv').checked) ng_words.push('役');
  if (!document.getElementById('song').checked) ng_words.push('曲');

  let min_count = 4;
  min_count = document.getElementById('min_count').value;

  //スコア計算用変数
  //[長さ0のマッチ数, 長さ1のマッチ数, ...]
  let match_count = Array(30);
  match_count.fill(0);

  //テキストを走査してマッチするアイドルを探す
  let matched_idols = [];
  for (let i = 0; i < text_aiueo.length; i++){
    let idol_names = [];
    for (let name in words){
      const aiueo = words[name]['aiueo'];
      const description = words[name]['description'];



      //aieoと文字列がマッチしたら追加
      if (text_aiueo.indexOf(aiueo, i) == i){

        if (aiueo.length < 1) continue;

        //スコア計算用
        match_count[aiueo.length] += 1;

        //aiueoの数が規定数以下だったらスキップ
        if (aiueo.length < min_count) continue;

        //desctiptionにNGワードが入っていたらスキップ
        let ng = false;
        for (let ng_word of ng_words){
          if (description.indexOf(ng_word) > -1) ng = true;
        }
        if (ng) continue;

        //フィルターを通過したものだけ表示
        idol_names.push(`<span title="${name}(${words[name]['kana']})\n${description}">${name}</span><br>(${aiueo})`);
      }
    }
    matched_idols.push(idol_names);
  }
  //スコア計算
  let score = 0;
  for (let i = 0; i < match_count.length; i++){
    score += Math.pow(10, i-1)*match_count[i];
  }
  score = score/text.length;
  document.getElementById('score').innerHTML = `文章のアイマス度： <span style="font-size: x-large;font-weight: bold;">${Number(score.toFixed(1)).toLocaleString()}</span>ポイント`;


  //ＨＴＭＬを出力
  let html = '';
  let text_position = -1;
  let idols = [];
  for (let i = 0; i < matched_idols.length; i++){
    if (matched_idols[i].length < 1){
      continue;
    }
    
    if (text_position < 0){
      html += `<div class="text" style="float:left;">${text.slice(0, aiueo_text_index[i])}</div>`
      text_position = i;
      idols = matched_idols[i];
      continue;
    }
    
    html += `<div class="text" style="float:left;">${text.slice(aiueo_text_index[text_position], aiueo_text_index[i])}<br><div class="idol">${idols.join('<br>')}</div></div>`
    text_position = i;
    idols = matched_idols[i];
  }
  html += `<div class="text" style="float:left;">${text.slice(aiueo_text_index[text_position], aiueo_text_index[matched_idols.length])}<br><div class="idol">${idols.join('<br>')}</div></div>`
  document.getElementById('result').innerHTML = html;

}

function btn_click(){
  generate_in();
  console.log(document.getElementById('song').checked);
}

function init_options(){
  let text = '';
  text += `
    最少文字数: <input type="number" min="1" value="4" style="width: 50px;" id="min_count" />　
    <input type="checkbox" class="filter" id="song" value="曲" /> 曲　
    <input type="checkbox" class="filter" id="cv" value="役" /> 声優　
  `;

  document.getElementById('options').insertAdjacentHTML('beforeend', text);
}

function init(){
  init_words();
  init_options();

}
