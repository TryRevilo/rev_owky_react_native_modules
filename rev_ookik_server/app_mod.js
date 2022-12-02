var myModuleMethod = (varArgs) => {
    console.log('Dynamic Call :  ' + varArgs);

    return true;
};

module.exports.myModuleMethod = myModuleMethod;