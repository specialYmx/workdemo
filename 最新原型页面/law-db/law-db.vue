<template>
  <div class="page flex-col">
    <div class="box_1 flex-row">
      <img
        class="image_1"
        referrerpolicy="no-referrer"
        src="https://lanhu-oss-2537-2.lanhuapp.com/SketchPng34491aa4e38d8413064408679ca7f77ebd376afc62a9cc58634f027a3faccb49"
      >
      <span class="text_1">首页概览</span> <span class="text_2">法规汇编</span>
      <span class="text_3">新规解读</span> <span class="text_4">处罚汇编</span>
      <span class="text_5">处罚汇编</span> <span class="text_6">研究集锦</span>
      <span class="text_7">法律合规季刊</span>
      <div class="text-wrapper_1 flex-col">
        <span class="text_8">智库更新</span>
      </div>
      <span class="text_9">人工审核</span>
      <img
        class="label_1"
        referrerpolicy="no-referrer"
        src="https://lanhu-oss-2537-2.lanhuapp.com/SketchPngec63a8d68ad14c8975d4fd9e77e63fd51c9f68276db598812061966f93aa50e3"
      >
    </div>
    <div class="box_2 flex-col">
      <span class="text_10">智库更新与通知</span>
      <div class="text-wrapper_2 flex-col">
        <span class="text_11">法律汇编</span>
      </div>
      <div class="list_1 flex-col">
        <div
          v-for="(item, index) in loopData0"
          :key="index"
          class="list-items_1 flex-col"
        >
          <div class="block_1 flex-row">
            <img
              class="label_2"
              referrerpolicy="no-referrer"
              :src="item.lanhuimage0"
            >
            <div
              v-if="item.slot1 === 1"
              class="text-group_1 flex-col justify-between"
            >
              <span
                class="text_12"
                v-html="item.specialSlot1.lanhutext0"
              />
              <span
                class="text_13"
                v-html="item.specialSlot1.lanhutext1"
              />
            </div>
            <div
              v-if="item.slot2 === 2"
              class="text-wrapper_3 flex-col justify-between"
            >
              <span
                class="text_14"
              >关于进一步规范保险资金股权投资有关事项的通知</span>
              <span class="text_15">2024-01-15&nbsp;14:30</span>
            </div>
          </div>
          <span class="text_16" v-html="item.lanhutext0" />
          <div class="block_2 flex-row">
            <div class="text-group_2 flex-col justify-between">
              <span class="text_17" v-html="item.lanhutext1" />
              <div class="text-wrapper_4">
                <span class="text_18" v-html="item.lanhutext2" />
                <span class="text_19" v-html="item.lanhutext3" />
                <span class="text_20" v-html="item.lanhutext4" />
                <span class="text_21" v-html="item.lanhutext5" />
                <span class="text_22" v-html="item.lanhutext6" />
                <span class="text_23" v-html="item.lanhutext7" />
              </div>
            </div>
          </div>
          <div class="block_3 flex-row">
            <div class="text-wrapper_5 flex-col">
              <span
                class="text_24"
                :style="{ color: item.lanhufontColor8 }"
                v-html="item.lanhutext8"
              />
            </div>
            <div class="text-wrapper_6 flex-col">
              <span class="text_25" v-html="item.lanhutext9" />
            </div>
            <div class="text-wrapper_7 flex-col">
              <span class="text_26" v-html="item.lanhutext10" />
            </div>
            <div class="text-wrapper_8 flex-col">
              <span class="text_27" v-html="item.lanhutext11" />
            </div>
            <div class="text-wrapper_9 flex-col">
              <span class="text_28" v-html="item.lanhutext12" />
            </div>
          </div>
        </div>
      </div>
      <div class="section_1 flex-row">
        <img
          class="label_3"
          referrerpolicy="no-referrer"
          src="https://lanhu-oss-2537-2.lanhuapp.com/SketchPng2e68f9b8860dfe1e3b8a05a6ed94ecd36e32d06971cae9aab89550a510f2656b"
        >
        <div class="text-wrapper_10 flex-col">
          <span class="text_29">1</span>
        </div>
        <img
          class="label_4"
          referrerpolicy="no-referrer"
          src="https://lanhu-oss-2537-2.lanhuapp.com/SketchPngb9ab707ccbd5d9bd426907c141f2fd9d53a37f5f628a2bd60359e33d5a0178ce"
        >
        <div class="text-wrapper_11 flex-col">
          <span class="text_30">50</span>
        </div>
        <div class="text-wrapper_12 flex-col">
          <span class="text_31">51</span>
        </div>
        <div class="text-wrapper_13 flex-col">
          <span class="text_32">52</span>
        </div>
        <div class="text-wrapper_14 flex-col">
          <span class="text_33">53</span>
        </div>
        <div class="text-wrapper_15 flex-col">
          <span class="text_34">54</span>
        </div>
        <img
          class="label_5"
          referrerpolicy="no-referrer"
          src="https://lanhu-oss-2537-2.lanhuapp.com/SketchPngb9ab707ccbd5d9bd426907c141f2fd9d53a37f5f628a2bd60359e33d5a0178ce"
        >
        <div class="text-wrapper_16 flex-col">
          <span class="text_35">90</span>
        </div>
        <img
          class="label_6"
          referrerpolicy="no-referrer"
          src="https://lanhu-oss-2537-2.lanhuapp.com/SketchPng607f679ac1f0bfd04828e5e8f56d729b5631a29a5769fc20d88e09538fd248bf"
        >
        <span class="text_36">跳至</span>
        <div class="box_3 flex-col" />
        <span class="text_37">页</span>
      </div>
      <div class="text-wrapper_17 flex-col">
        <span class="text_38">新规解读</span>
      </div>
      <div class="text-wrapper_18 flex-col">
        <span class="text_39">处罚汇编</span>
      </div>
      <div class="text-wrapper_19 flex-col">
        <span class="text_40">研究集锦</span>
      </div>
      <div class="text-wrapper_20 flex-col">
        <span class="text_41">全部更新</span>
      </div>
      <div class="text-wrapper_21 flex-col">
        <span class="text_42">法律合规季刊</span>
      </div>
    </div>
    <div class="text-wrapper_22 flex-col">
      <span
        class="text_43"
      >版本：1.0.0&nbsp;&nbsp;2022&nbsp;大家资产管理有限责任公司&nbsp;版权所有</span>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      loopData0: [
        {
          lanhuimage0:
            'https://lanhu-oss-2537-2.lanhuapp.com/SketchPng4baf3c7158aeeb908cddd587cea6f3a4eb260059f69d713aa9d807c44dbed6b0',
          lanhutext0:
            '为进一步规范保险资金股权投资行为，防范投资风险，保护被保险人利益，现就有关事项通知如下：一是明确投资决策程序，二是加强风险管控措施，三是强化信息披露要求...',
          lanhutext1: 'AI智能解读主要变更点：',
          lanhutext2: '投资决策程序优化:',
          lanhutext3: '&nbsp;强调董事会在重大股权投资中的核心决策地位。<br/>',
          lanhutext4: '风险管控体系强化:',
          lanhutext5: '新增对股权投资集中度风险的量化指标。<br/>',
          lanhutext6: '信息披露标准提升:',
          lanhutext7: '&nbsp;扩大了信息披露范围，增强透明度。',
          lanhutext8: '机构监管',
          lanhufontColor8: 'rgba(243,109,120,1)',
          lanhutext9: '公司治理',
          lanhutext10: '行业协会',
          lanhutext11: '查看详情',
          lanhutext12: '下载文件',
          slot2: 2
        },
        {
          lanhuimage0:
            'https://lanhu-oss-2537-2.lanhuapp.com/SketchPng10db4b082bfc821ab30f8a18800b928c3a4878122cd9a6a1fa3138ef5fe0fb2b',
          lanhutext0:
            '为完善偿付能力监管制度，提高监管有效性，金融监管总局发布偿付能力监管规则修订征求意见稿，主要修订内容包括：风险因子调整、资本要求优化、监管指标完善等...',
          lanhutext1: 'AI智能解读主要变更点：',
          lanhutext2: '投资决策程序优化:',
          lanhutext3: '&nbsp;强调董事会在重大股权投资中的核心决策地位。<br/>',
          lanhutext4: '风险管控体系强化:',
          lanhutext5: '新增对股权投资集中度风险的量化指标。<br/>',
          lanhutext6: '信息披露标准提升:',
          lanhutext7: '&nbsp;扩大了信息披露范围，增强透明度。',
          lanhutext8: '机构监管',
          lanhufontColor8: 'rgba(243,109,120,1)',
          lanhutext9: '公司治理',
          lanhutext10: '行业协会',
          lanhutext11: '查看详情',
          lanhutext12: '下载文件',
          specialSlot1: {
            lanhutext0: '偿付能力监管规则修订征求意见稿发布',
            lanhutext1: '2024-01-15&nbsp;14:30'
          },
          slot1: 1
        },
        {
          lanhuimage0:
            'https://lanhu-oss-2537-2.lanhuapp.com/SketchPngd2548194830a8d2aac5b343579208aab422335661bf516b973f89b7eef6c2fc0',
          lanhutext0:
            '根据最新监管要求，公司修订关联交易管理制度，制定详细执行指引。修订要点：扩大关联方认定范围、完善审批流程、加强持续监管、明确责任追究机制...',
          lanhutext1: 'AI智能解读主要变更点：',
          lanhutext2: '投资决策程序优化:',
          lanhutext3: '&nbsp;强调董事会在重大股权投资中的核心决策地位。<br/>',
          lanhutext4: '风险管控体系强化:',
          lanhutext5: '新增对股权投资集中度风险的量化指标。<br/>',
          lanhutext6: '信息披露标准提升:',
          lanhutext7: '&nbsp;扩大了信息披露范围，增强透明度。',
          lanhutext8: '风控合规',
          lanhufontColor8: 'rgba(50,192,185,1)',
          lanhutext9: '关联交易',
          lanhutext10: '其他机构',
          lanhutext11: '查看详情',
          lanhutext12: '下载文件',
          specialSlot1: {
            lanhutext0: '关联交易管理制度修订及执行指引',
            lanhutext1: '2024-01-15&nbsp;14:30'
          },
          slot1: 1
        },
        {
          lanhuimage0:
            'https://lanhu-oss-2537-2.lanhuapp.com/SketchPngd2548194830a8d2aac5b343579208aab422335661bf516b973f89b7eef6c2fc0',
          lanhutext0:
            '为进一步规范保险资金股权投资行为，防范投资风险，保护被保险人利益，现就有关事项通知如下：一是明确投资决策程序，二是加强风险管控措施，三是强化信息披露要求...',
          lanhutext1: 'AI智能解读主要变更点：',
          lanhutext2: '投资决策程序优化:',
          lanhutext3: '&nbsp;强调董事会在重大股权投资中的核心决策地位。<br/>',
          lanhutext4: '风险管控体系强化:',
          lanhutext5: '新增对股权投资集中度风险的量化指标。<br/>',
          lanhutext6: '信息披露标准提升:',
          lanhutext7: '&nbsp;扩大了信息披露范围，增强透明度。',
          lanhutext8: '风控合规',
          lanhufontColor8: 'rgba(50,192,185,1)',
          lanhutext9: '关联交易',
          lanhutext10: '其他机构',
          lanhutext11: '查看详情',
          lanhutext12: '下载文件',
          specialSlot1: {
            lanhutext0: '关于进一步规范保险资金股权投资有关事项的通知',
            lanhutext1: '2024-01-15&nbsp;14:30'
          },
          slot1: 1
        },
        {
          lanhuimage0:
            'https://lanhu-oss-2537-2.lanhuapp.com/SketchPng10db4b082bfc821ab30f8a18800b928c3a4878122cd9a6a1fa3138ef5fe0fb2b',
          lanhutext0:
            '为进一步规范保险资金股权投资行为，防范投资风险，保护被保险人利益，现就有关事项通知如下：一是明确投资决策程序，二是加强风险管控措施，三是强化信息披露要求...',
          lanhutext1: 'AI智能解读主要变更点：',
          lanhutext2: '投资决策程序优化:',
          lanhutext3: '&nbsp;强调董事会在重大股权投资中的核心决策地位。<br/>',
          lanhutext4: '风险管控体系强化:',
          lanhutext5: '新增对股权投资集中度风险的量化指标。<br/>',
          lanhutext6: '信息披露标准提升:',
          lanhutext7: '&nbsp;扩大了信息披露范围，增强透明度。',
          lanhutext8: '机构监管',
          lanhufontColor8: 'rgba(243,109,120,1)',
          lanhutext9: '公司治理',
          lanhutext10: '行业协会',
          lanhutext11: '查看详情',
          lanhutext12: '下载文件',
          specialSlot1: {
            lanhutext0: '关于进一步规范保险资金股权投资有关事项的通知',
            lanhutext1: '2024-01-15&nbsp;14:30'
          },
          slot1: 1
        }
      ],
      constants: {}
    }
  },
  methods: {}
}
</script>
<!-- <style src="./common.css" /> -->
<style src="../index.css" />
