/* 设置页 */
const backupKey = "backup"
const backupName = "backupName"
const defaultBackupName = "默认设置"
//初始化设置页
initialize()
setTimeout(function(){
    alert("在离开设置页前，请点击空白处以确保更改被正常保存~")
},500)

//报错捕捉函数
function catchErr(sender) {
	if (chrome.runtime.lastError) {
        console.log(sender + " => chrome.runtime.lastError：\n" + chrome.runtime.lastError.message)
        return true
	}else{
        return false
    }
}

//设置属性
function setAttributes(element,attributes){
	for(let key in attributes){
		if(Object.prototype.toString.call(attributes[key]) === '[object Object]'){
			setAttributes(element[key],attributes[key])
		}else{
			element[key] = attributes[key]
		}
	}
}

// 新建设置
function addProfile(){
    chrome.storage.local.get(function(settings){
        let promptContainer = document.getElementById("promptContainer")
        document.getElementById("promptLabel").textContent = "请输入这个新的配置文件名"
        let input = document.getElementById("promptInput")
        //"确定"
        document.getElementById("promptConfirmButton").onclick = function(){
            let profileName = input.value
            if(profileName == ""){//未输入
                input.placeholder = "请输入配置名"
            }else if(settings[backupKey][profileName] != undefined){//键值在local中存在
                setAttributes(input,{value:"",placeholder:"该配置名已存在，请重新输入"})
            }else{
                //在local中新建设置（以sync中的数据为值）
                chrome.storage.sync.get(function(setting) {
                    settings[backupKey][profileName] = setting
                    settings[backupKey][profileName][backupName] = undefined
                    setting[backupName] = profileName
                    updateStorageArea({setting:setting,settings:settings},function(){
                        promptContainer.style.display = "none"
                        setAttributes(input,{value:"",placeholder:""})
                        initialize()
                    })
                })
            }
        }
        promptContainer.style.display = "block"
        input.focus()
    })
}

//删除设置
function deleteProfile(){
    let confirmContainer = document.getElementById("confirmContainer")
    document.getElementById("confirmLabel").textContent = "请确认是否移除所选配置文件"
    let confirmLabel = document.getElementById("confirmLabel")
    //确认
    document.getElementById("confirmButton").onclick = function(){
        //删除local数据
        chrome.storage.local.get(function(settings){
            let currentSelect = document.getElementById("profileNamesInput").value
            if(currentSelect == defaultBackupName)return
            delete settings[backupKey][currentSelect]
            let setting = settings[backupKey][defaultBackupName]//设置sync为默认
            setting[backupName] = defaultBackupName
            updateStorageArea({setting:setting,settings:settings},function(){
                confirmLabel.textContent = ""
                confirmContainer.style.display = "none"
                initialize()
            })
        })
    }
    //取消
    document.getElementById("cancelButton").onclick = function(){
        confirmLabel.textContent = ""
        confirmContainer.style.display = "none"
    }
    confirmContainer.style.display = "block"
}

//重命名设置
function renameProfile(){
    let promptContainer = document.getElementById("promptContainer")
    document.getElementById("promptLabel").textContent = "请为所选配置文件输入新的名称"
    let input = document.getElementById("promptInput")
    //确认
    document.getElementById("promptConfirmButton").onclick = function(){
        //修改local数据
        chrome.storage.local.get(function(settings){
            if(input.value == ""){
                input.placeholder = "请输入新的名称"
            }else if(settings[backupKey][input.value] != undefined){
                setAttributes(input,{value:"",placeholder:"该配置名已存在，请重新输入"})
            }else{
                let currentSelect = document.getElementById("profileNamesInput").value
                let profile = settings[backupKey][currentSelect]
                let profileName = input.value
                delete settings[backupKey][currentSelect]
                settings[backupKey][profileName] = profile
                let setting = profile
                setting[backupName] = profileName
                updateStorageArea({setting:setting,settings:settings},function(){
                    promptContainer.style.display = "none"
                    setAttributes(input,{value:"",placeholder:""})
                    initialize()
                })
            }
        })
    }
    promptContainer.style.display = "block"
    input.focus()
}

//更新sync和local
function updateStorageArea(configMsg={},callback=function(){}){
    //存在异步问题，故设置用于处理短时间内需要进行多次设置的情况
    if(configMsg.setting && configMsg.settings){
        chrome.storage.sync.set(configMsg.setting,function(){
            if(catchErr("updateSyncAndLocal"))alert("数据过大,存储出错,请缩短数据")
            chrome.storage.local.set(configMsg.settings,function(){
                if(catchErr("updateSyncAndLocal"))alert("数据过大,存储出错,请缩短数据")
                callback()
            })  
        })
    }else if(configMsg.key && configMsg.value){
        let config = {}
        let key = configMsg.key
        let value = configMsg.value
        config[key] = value
        chrome.storage.sync.set(config,function(){
            if(catchErr("updateSyncAndLocal"))alert("数据过大,存储出错,请缩短数据")
            chrome.storage.local.get(function(settings){
                const currentProfile = document.getElementById("profileNamesInput").value
                settings[backupKey][currentProfile][key] = (key == backupName) ? undefined : value
                chrome.storage.local.set(settings,function(){
                    if(catchErr("updateSyncAndLocal"))alert("数据过大,存储出错,请缩短数据")
                    callback()
                })
            })
        })
    }
}

//更新正则
function updateRegexp(){
    const checkedRexpKey = "checkedRe"
    const regexpKey = "re"
    let checkedRegexpValue = []
    let regexpValue = []
    let checkBoxCollection = document.getElementsByClassName("contextMenuEnabledInput")
    for(let i = 0,len = checkBoxCollection.length;i < len;i++){
        let parent = checkBoxCollection[i].parentNode.parentNode
        let id = checkBoxCollection[i].id
        let re = parent.getElementsByClassName("regexp")[0].value
        let pre = parent.getElementsByClassName("regexp_pre")[0].value
        let suf = parent.getElementsByClassName("regexp_suf")[0].value
        let regexpData = [id,re,pre,suf]
        regexpValue.push(regexpData)
        if(checkBoxCollection[i].checked && re != ""){//获取已启用正则数据
            checkedRegexpValue.push(regexpData)
        }
    }
    updateStorageArea({key:regexpKey,value:regexpValue},function(){//更新全部正则
        updateStorageArea({key:checkedRexpKey,value:checkedRegexpValue})//更新已启用正则
    })
}

//初始化一般选项
function initializeBasic(){
    /* 帮助按钮点击事件 */
    let helpIcons = document.getElementsByClassName("help-icon")
    let helpContents = document.getElementsByClassName("help-content")
    for (let index = 0,len = helpIcons.length;index < len; index++) {
        helpIcons[index].onclick = function(){
            helpContents[index].hidden = !helpContents[index].hidden
            return false
        }
    }
    /* 全部展开 */
    let expandAllButton = document.getElementById("expandAllButton")
    expandAllButton.onclick = function(){
		if (expandAllButton.className) {
			expandAllButton.className = ""
		} else {
			expandAllButton.className = "opened"
		}
		document.querySelectorAll("details").forEach(detailElement => detailElement.open = Boolean(expandAllButton.className))
    }
    /* prompt 弹窗初始化 */
    let input = document.getElementById("promptInput")
    //prompt 取消
    document.getElementById("promptCancelButton").onclick = function(){
        setAttributes(input,{value:"",placeholder:""})
        document.getElementById("promptContainer").style.display = "none"
    }
    //prompt 回车确定
    input.onkeyup = event => {
        if (event.code == "Enter") {
            document.getElementById("promptConfirmButton").click()
            return false
        }
    }
}

//初始化
function initialize(){
    initializeBasic()
    /************************************************************************************/
    chrome.storage.sync.get(function(setting) {
        console.log("chrome.storage.sync.get(function(setting){\nconsole.log(setting)\n})")
        console.log(setting)
        /************************************************************************************/
        /* 配置选项初始化 */
        chrome.storage.local.get(function(settings){
            console.log("chrome.storage.local.get(function(settings){\nconsole.log(settings)\n})")
            console.log(settings)
            console.log("********************************************")
            let profileNamesInput = document.getElementById("profileNamesInput")
            //先清空select列表
            profileNamesInput.options.length = 0
            //各配置添加到select列表
            for(let key in settings[backupKey]){
                let option = document.createElement("option")
                option.text = key
                if(key == defaultBackupName){
                    profileNamesInput.add(option,profileNamesInput.options[0])//默认设置放第一位
                }else{
                    profileNamesInput.add(option,null)
                }
            }
            //选中当前配置
            let currentProfile = setting[backupName]
            if(settings[backupKey][currentProfile] == undefined){//处理当前配置在local中不存在的情况
                settings[backupKey][currentProfile] = setting
                settings[backupKey][currentProfile][backupName] = undefined
                chrome.storage.local.set(settings,function(){
                    if(catchErr("initialize"))alert("数据过大,存储出错,请缩短数据")
                })
            }
            let options = profileNamesInput.options
            for (let i=0; i<options.length; i++){
                if(options[i].text == currentProfile){
                    options[i].selected = true
                    //设置重命名按钮和删除配置按钮的disabled属性
                    let isDisabled = (currentProfile == defaultBackupName)
                    document.getElementById("deleteProfileButton").disabled = isDisabled
                    document.getElementById("renameProfileButton").disabled = isDisabled
                    break
                }
            }
            //当只存在默认设置时select控件的disabled属性设置为true
            profileNamesInput.disabled = (options.length == 1 && profileNamesInput.value == defaultBackupName)
            //选项改变则重载
            profileNamesInput.onchange = function(){
                let profileName = this.value
                chrome.storage.local.get(function(settings){
                    let setting = settings[backupKey][profileName]
                    if(setting == undefined)return
                    setting[backupName] = profileName
                    chrome.storage.sync.set(setting,function(){
                        if(catchErr("initialize"))alert("数据过大,存储出错,请缩短数据")
                        initialize()
                    })
                })
            }
        })
        //新建配置
        document.getElementById("addProfileButton").onclick = addProfile
        //删除设置
        document.getElementById("deleteProfileButton").onclick = deleteProfile
        //重命名设置
        document.getElementById("renameProfileButton").onclick = renameProfile

        //"标注、标题、想法、代码块" input 事件
        const inputIds = ["s1Pre","s1Suf","s2Pre","s2Suf","s3Pre","s3Suf","lev1","lev2","lev3","thouPre","thouSuf","codePre","codeSuf"]
        //"是否显示热门标注人数"、"标注添加想法"、"开启转义" CheckBox 点击事件
        const CheckBoxIds = ["displayN","addThoughts","escape"]
        const ids = inputIds.concat(CheckBoxIds)
        for(let i=0,len=ids.length;i<len;i++){
            let id = ids[i]
            let element = document.getElementById(id)
            let isInput = inputIds.indexOf(id) > -1
            isInput ? element.value = setting[id] : element.checked = setting[id]
            element.onchange = function(){
                let key = this.id
                let value = isInput ? this.value : this.checked
                updateStorageArea({key:key,value:value})
            }
        }
        /************************************************************************************/
        /* 正则匹配初始化 */
        function setRegexpValue(parent,reMsg){
            let regexpInput = parent.getElementsByClassName("regexp")[0]
            setAttributes(regexpInput,{placeholder:"",value:reMsg[1]})
            parent.getElementsByClassName("regexp_pre")[0].value = reMsg[2]
            parent.getElementsByClassName("regexp_suf")[0].value = reMsg[3]
        }
        const checkedReCollection = setting.checkedRe
        let checkBoxCollection = document.getElementsByClassName("contextMenuEnabledInput")
        let regexpCheckBoxIds = []//保存已选中正则id
        //已开启正则初始化
        for(let i = 0,len1 = checkBoxCollection.length;i < len1;i++){
            checkBoxCollection[i].checked = false//先确保取消选中
            for(let j = 0,len2 = checkedReCollection.length;j < len2;j++){
                if(checkedReCollection[j][0] == checkBoxCollection[i].id){
                    checkBoxCollection[i].checked = true
                    regexpCheckBoxIds.push(checkedReCollection[j][0])
                    let parent = checkBoxCollection[i].parentNode.parentNode
                    setRegexpValue(parent,checkedReCollection[j])
                    break
                }
            }
        }
        //正则表达式 checkbox 点击事件
        for(let i = 0,len = checkBoxCollection.length;i < len;i++){
            checkBoxCollection[i].onclick = function(){
                let regexpInput = this.parentNode.parentNode.getElementsByClassName("regexp")[0]
                updateRegexp()//不检查regexpInput.value是否为空，将其留在updateRegexp中检查
                if(regexpInput.value == "" && this.checked){//检查this.checked使得取消选中的动作中不会触发
                    regexpInput.placeholder = "请输入正则表达式"
                    this.checked = false
                }
            }
        }
        //正则表达式 input、textarea 内容初始化
        let regexpContainers = document.getElementsByClassName("regexpContainer")
        const reCollection = setting.re
        for(let i = 0,len1 = reCollection.length;i<len1;i++){
            //检查是否属于已开启正则
            if(regexpCheckBoxIds.indexOf(reCollection[i][0]) > -1)continue
            setRegexpValue(regexpContainers[i],reCollection[i])
        }
        //正则表达式 input、textarea input事件（事件绑定不能够放进上方对reCollection的遍历中，因为reCollection可能为空）
        const classNameArray = ["regexp","regexp_pre","regexp_suf"]
        for(let i=0,len1=classNameArray.length;i<len1;i++){
            let collection = document.getElementsByClassName(classNameArray[i])
            for(let j=0,len2=collection.length;j<len2;j++){
                collection[j].onchange = function(){
                    updateRegexp()
                }
            }
        }
    })
}